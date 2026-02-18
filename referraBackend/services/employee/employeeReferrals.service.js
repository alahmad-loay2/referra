import { prisma } from "../../lib/prisma.js";
import { Resend } from "resend";
import {
  RESEND_API_KEY,
  FRONTEND_URL,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} from "../../config/env.js";
import { supabase } from "../../lib/supabase.js";
import { createClient } from "@supabase/supabase-js";

const getResend = () => {
  // In test environment, return a no-op mock so tests don't require a real API key
  if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "integration") {
    return {
      emails: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        send: async (_args) => {
          // no-op in tests
          return;
        },
      },
    };
  }

  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set in environment variables");
  }

  return new Resend(RESEND_API_KEY);
};

// Create a new referral for a candidate by an employee
// create the candidate if doesnt exist
// cv upload to supabase storage
// send confirmation email to candidate
export const createReferral = async (payload) => {
  const {
    candidateFirstName,
    candidateLastName,
    candidateEmail,
    candidatePhoneNumber,
    candidateYearOfExperience,
    positionId,
    employeeId,
    cvFile,
    cvFileName,
  } = payload;

  const isMissingYearOfExperience =
    candidateYearOfExperience === undefined ||
    candidateYearOfExperience === null ||
    candidateYearOfExperience === "";

  if (
    !candidateFirstName ||
    !candidateLastName ||
    !candidateEmail ||
    !candidatePhoneNumber ||
    isMissingYearOfExperience ||
    !positionId ||
    !employeeId ||
    !cvFile
  ) {
    const error = new Error(
      "candidateFirstName, candidateLastName, candidateEmail, candidatePhoneNumber, candidateYearOfExperience, positionId, and cvFile are required",
    );
    error.statusCode = 400;
    throw error;
  }

  // Length validations (must match prisma schema constraints)
  if (candidateFirstName.length > 50) {
    const error = new Error("First name must be at most 50 characters");
    error.statusCode = 400;
    throw error;
  }

  if (candidateLastName.length > 50) {
    const error = new Error("Last name must be at most 50 characters");
    error.statusCode = 400;
    throw error;
  }

  if (candidateEmail.length > 255) {
    const error = new Error("Email must be at most 255 characters");
    error.statusCode = 400;
    throw error;
  }

  if (candidatePhoneNumber.length > 32) {
    const error = new Error("Phone number must be at most 32 characters");
    error.statusCode = 400;
    throw error;
  }

  // Upload CV to Supabase first
  // Generate filename from original filename + date
  let fileName;
  if (cvFileName) {
    // Extract filename without extension
    const originalName = cvFileName.replace(/\.(pdf|PDF)$/, "");
    // Sanitize filename: remove special characters, keep only alphanumeric, spaces, hyphens, underscores
    const sanitizedName = originalName
      .replace(/[^a-zA-Z0-9\s\-_]/g, "")
      .trim()
      .replace(/\s+/g, "-");
    // Use full timestamp to ensure uniqueness even for multiple uploads per day
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    fileName = `${sanitizedName}-${timestamp}.pdf`;
  } else {
    // Fallback to old format if original filename is not available
    const fileExt = "pdf";
    fileName = `${candidateEmail}-${Date.now()}.${fileExt}`;
  }

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("cvs")
    .upload(fileName, cvFile, {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    const error = new Error(`CV upload failed: ${uploadError.message}`);
    error.statusCode = 500;
    throw error;
  }

  const cvUrl = `${SUPABASE_URL}/storage/v1/object/public/cvs/${fileName}`;
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const position = await tx.position.findUnique({
      where: { PositionId: positionId },
    });

    if (!position) {
      const error = new Error("Position not found");
      error.statusCode = 404;
      throw error;
    }

    // Check position state and deadline atomically within transaction
    if (position.PositionState !== "OPEN" || position.Deadline < now) {
      // Auto-close expired positions
      if (position.PositionState === "OPEN" && position.Deadline < now) {
        await tx.position.update({
          where: { PositionId: positionId },
          data: { PositionState: "CLOSED" },
        });
      }

      const error = new Error("This position is closed or has expired");
      error.statusCode = 400;
      throw error;
    }

    const employee = await tx.employee.findUnique({
      where: { EmployeeId: employeeId },
    });

    if (!employee) {
      const error = new Error("Employee not found");
      error.statusCode = 404;
      throw error;
    }

    let candidate = await tx.candidate.findUnique({
      where: { Email: candidateEmail },
      include: {
        Application: true,
      },
    });

    if (candidate) {
      // Check if candidate has already been accepted/hired
      if (candidate.Acceptance === true) {
        const error = new Error(
          "Cannot refer a candidate who has already been accepted/hired",
        );
        error.statusCode = 400;
        throw error;
      }

      // Prevent duplicate applications for the SAME position,
      // even if created by a different employee.
      const existingForSamePosition = await tx.application.findFirst({
        where: {
          CandidateId: candidate.CandidateId,
          PositionId: positionId,
        },
      });

      if (existingForSamePosition) {
        const error = new Error(
          "Application already exists for this candidate and position",
        );
        error.statusCode = 400;
        throw error;
      }
    }

    if (!candidate) {
      // Create new candidate with submitted data (CV and experience are stored per referral)
      candidate = await tx.candidate.create({
        data: {
          FirstName: candidateFirstName,
          LastName: candidateLastName,
          Email: candidateEmail,
          PhoneNumber: candidatePhoneNumber,
        },
      });
    } else {
      // Email already exists → update the existing candidate with the latest contact info
      // CV and years of experience are referral-specific now.
      const updateData = {
        FirstName: candidateFirstName,
        LastName: candidateLastName,
        PhoneNumber: candidatePhoneNumber,
      };

      candidate = await tx.candidate.update({
        where: { CandidateId: candidate.CandidateId },
        data: updateData,
      });
    }

    const referral = await tx.referral.create({
      data: {
        Status: "Pending",
        AcceptedInOtherPosition: false,
        YearOfExperience: parseInt(candidateYearOfExperience, 10),
        CVUrl: cvUrl,
      },
    });

    const application = await tx.application.create({
      data: {
        ReferralId: referral.ReferralId,
        EmployeeId: employeeId,
        CandidateId: candidate.CandidateId,
        PositionId: positionId,
      },
      include: {
        Referral: true,
        Candidate: true,
        Employee: true,
        Position: true,
      },
    });

    return application;
  });

  // Fire-and-forget email send: do not block API response on Resend latency.
  // If sending fails, we log it but still keep the created referral.
  (async () => {
    try {
      const frontendUrl = FRONTEND_URL;
      const confirmationUrl = `${frontendUrl}/referral/confirm/${result.Referral.ReferralId}`;

      const resend = getResend();
      await resend.emails.send({
        from: "no-reply@referra.space",
        to: candidateEmail,
        subject: "Referral Confirmation Request",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hello ${candidateFirstName} ${candidateLastName},</h2>
            <p>You have been referred for the position: <strong>${result.Position.PositionTitle}</strong></p>
            <p>Please click the link below to confirm your referral:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" 
                 style="background-color:rgb(76, 87, 175); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Confirm Referral
              </a>
            <strong>This link will expire in 2 days.</strong>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">${confirmationUrl}</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
    }
  })();

  return result;
};

// candidate confirms referral using referralId
export const confirmReferral = async (referralId) => {
  if (!referralId) {
    const error = new Error("Referral ID is required");
    error.statusCode = 400;
    throw error;
  }

  const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;

  const confirmedReferral = await prisma.$transaction(async (tx) => {
    // Fetch referral with all necessary relations within transaction
    const referral = await tx.referral.findUnique({
      where: { ReferralId: referralId },
      include: {
        Application: {
          include: {
            Candidate: true,
            Position: true,
          },
        },
      },
    });

    if (!referral) {
      const error = new Error("Referral not found");
      error.statusCode = 404;
      throw error;
    }

    if (referral.Status !== "Pending") {
      const error = new Error(`Referral is already ${referral.Status}`);
      error.statusCode = 400;
      throw error;
    }

    if (referral.Application?.Position?.PositionState === "CLOSED") {
      const error = new Error(
        "Cannot confirm referral for a closed position. Please contact the person who referred you or HR.",
      );
      error.statusCode = 400;
      throw error;
    }

    const referralAge = Date.now() - new Date(referral.CreatedAt).getTime();
    if (referralAge > twoDaysInMs) {
      const error = new Error(
        "This referral confirmation link has expired. Please contact the person who referred you for a new link.",
      );
      error.statusCode = 410;
      throw error;
    }

    const updatedReferral = await tx.referral.update({
      where: { ReferralId: referralId },
      data: {
        Status: "Confirmed",
      },
      include: {
        Application: {
          include: {
            Candidate: true,
            Position: true,
            Employee: {
              include: {
                User: true,
              },
            },
          },
        },
      },
    });

    return updatedReferral;
  });

  return confirmedReferral;
};

// Employee deletes a candidate's application and referral if status is still pending
export const deleteCandidate = async (
  referralId,
  employeeId,
  accessToken = null,
) => {
  if (!referralId) {
    const error = new Error("Referral ID is required");
    error.statusCode = 400;
    throw error;
  }

  if (!employeeId) {
    const error = new Error("Employee ID is required");
    error.statusCode = 400;
    throw error;
  }

  // Status order for checking referral statuses
  const statusOrder = [
    "Pending",
    "Confirmed",
    "InterviewOne",
    "InterviewTwo",
    "Acceptance",
  ];

  const result = await prisma.$transaction(async (tx) => {
    const application = await tx.application.findFirst({
      where: {
        ReferralId: referralId,
        EmployeeId: employeeId,
      },
      include: {
        Referral: true,
        Candidate: {
          include: {
            Application: {
              include: {
                Referral: true,
              },
            },
          },
        },
      },
    });

    if (!application) {
      const error = new Error(
        "Application not found for this employee and referral",
      );
      error.statusCode = 404;
      throw error;
    }

    const candidate = application.Candidate;
    const candidateId = candidate.CandidateId;

    if (application.Referral.Status !== "Pending") {
      const error = new Error(
        `Cannot delete application. Referral status is ${application.Referral.Status}, not Pending`,
      );
      error.statusCode = 400;
      throw error;
    }

    const hasConfirmedOrAbove = candidate.Application.some((app) => {
      // Skip the current application we're deleting
      if (app.ReferralId === referralId) {
        return false;
      }
      const statusIndex = statusOrder.indexOf(app.Referral.Status);
      const confirmedIndex = statusOrder.indexOf("Confirmed");
      return statusIndex >= confirmedIndex;
    });

    // Only delete candidate if:
    // 1. This is their only application (so we can safely delete without foreign key issues), AND
    // 2. They have no other referrals that are Confirmed or above
    // Since if this is their only application, they can't have other referrals,
    // this simplifies to: delete if this is their only application
    const willDeleteCandidate =
      candidate.Application.length === 1 && !hasConfirmedOrAbove;

    const referralCVUrl = application.Referral.CVUrl;

    await tx.application.delete({
      where: {
        ReferralId: referralId,
      },
    });

    await tx.referral.delete({
      where: {
        ReferralId: referralId,
      },
    });

    if (willDeleteCandidate) {
      await tx.candidate.delete({
        where: {
          CandidateId: candidateId,
        },
      });
    }

    return {
      deletedCandidate: willDeleteCandidate,
      referralCVUrl,
    };
  });

  // Delete CV file from Supabase for this referral
  // This happens outside transaction since it's an external service
  if (result.referralCVUrl) {
    try {
      // Extract filename from CVUrl (format: ${SUPABASE_URL}/storage/v1/object/public/cvs/${fileName})
      // Handle both full URL and relative path formats
      let fileName = result.referralCVUrl;

      // If it's a full URL, extract just the filename
      if (result.referralCVUrl.includes("/cvs/")) {
        const cvUrlParts = result.referralCVUrl.split("/cvs/");
        if (cvUrlParts.length === 2) {
          fileName = cvUrlParts[1];
        }
      } else if (result.referralCVUrl.includes("/")) {
        // If it's a path, get the last part (filename)
        fileName = result.referralCVUrl.split("/").pop();
      }

      // Remove any query parameters if present
      fileName = fileName.split("?")[0];

      // Create authenticated Supabase client with access token
      // This is needed to satisfy the RLS policy that requires authentication
      const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          headers: accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
              }
            : {},
        },
      });

      const { data, error: deleteError } = await supabaseClient.storage
        .from("cvs")
        .remove([fileName]);

      if (deleteError) {
        console.error(`Failed to delete CV file from Supabase:`, {
          fileName,
          error: deleteError.message,
          errorDetails: deleteError,
        });
        // Continue with deletion even if file deletion fails
      }
    } catch (error) {
      console.error(`Error deleting CV file from Supabase:`, {
        cvUrl: result.referralCVUrl,
        error: error.message,
        stack: error.stack,
      });
      // Continue with deletion even if file deletion fails
    }
  }

  return {
    message: result.deletedCandidate
      ? "Candidate deleted successfully"
      : "Application and referral deleted successfully. Candidate has other applications.",
    deletedCandidate: result.deletedCandidate,
  };
};

export const getEmployeeReferrals = async ({
  employeeId,
  page = 1,
  pageSize = 10,
  search,
  status,
  createdAt,
}) => {
  if (!employeeId) {
    const error = new Error("Employee ID is required");
    error.statusCode = 400;
    throw error;
  }

  const skip = (page - 1) * pageSize;

  const andFilters = [{ EmployeeId: employeeId }];

  if (search && search.trim() !== "") {
    andFilters.push({
      Candidate: {
        OR: [
          { FirstName: { contains: search, mode: "insensitive" } },
          { LastName: { contains: search, mode: "insensitive" } },
          { Email: { contains: search, mode: "insensitive" } },
        ],
      },
    });
  }

  if (status) {
    andFilters.push({
      Referral: { Status: status },
    });
  }

  if (createdAt) {
    const startOfDay = new Date(createdAt);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(createdAt);
    endOfDay.setHours(23, 59, 59, 999);

    andFilters.push({
      Referral: { CreatedAt: { gte: startOfDay, lte: endOfDay } },
    });
  }

  const where = { AND: andFilters };

  // Run count and findMany in parallel for faster response
  const [totalReferrals, applications] = await Promise.all([
    prisma.application.count({ where }),
    prisma.application.findMany({
      where,
      include: {
        Referral: true,
        Candidate: true,
        Position: {
          include: {
            Department: true,
          },
        },
      },
      skip,
      take: pageSize,
      orderBy: {
        Referral: { CreatedAt: "desc" },
      },
    }),
  ]);

  return {
    page,
    pageSize,
    totalReferrals,
    totalPages: Math.ceil(totalReferrals / pageSize),
    applications,
  };
};

export const editCandidate = async (payload) => {
  const {
    referralId,
    employeeId,
    candidateFirstName,
    candidateLastName,
    candidateEmail,
    candidatePhoneNumber,
    candidateYearOfExperience,
    cvFile,
    cvFileName,
    accessToken = null,
  } = payload;

  if (!referralId) {
    const error = new Error("Referral ID is required");
    error.statusCode = 400;
    throw error;
  }
  if (!employeeId) {
    const error = new Error("Employee ID is required");
    error.statusCode = 400;
    throw error;
  }

  // Ensure this referral belongs to the requesting employee and fetch candidate + referral
  const application = await prisma.application.findFirst({
    where: {
      ReferralId: referralId,
      EmployeeId: employeeId,
    },
    include: {
      Candidate: true,
      Referral: true,
      Position: true,
      Employee: true,
    },
  });

  if (!application) {
    const error = new Error(
      "Application not found for this employee and referral",
    );
    error.statusCode = 404;
    throw error;
  }

  const candidate = application.Candidate;
  const referral = application.Referral;

  const candidateDataToUpdate = {};
  const referralDataToUpdate = {};

  // Length validations for editable fields (respect prisma limits)
  if (candidateFirstName && candidateFirstName.length > 50) {
    const error = new Error("First name must be at most 50 characters");
    error.statusCode = 400;
    throw error;
  }

  if (candidateLastName && candidateLastName.length > 50) {
    const error = new Error("Last name must be at most 50 characters");
    error.statusCode = 400;
    throw error;
  }

  if (candidatePhoneNumber && candidatePhoneNumber.length > 32) {
    const error = new Error("Phone number must be at most 32 characters");
    error.statusCode = 400;
    throw error;
  }
  if (candidateFirstName !== undefined && candidateFirstName !== "") {
    candidateDataToUpdate.FirstName = candidateFirstName;
  }
  if (candidateLastName !== undefined && candidateLastName !== "") {
    candidateDataToUpdate.LastName = candidateLastName;
  }
  if (candidatePhoneNumber !== undefined && candidatePhoneNumber !== "") {
    candidateDataToUpdate.PhoneNumber = candidatePhoneNumber;
  }
  if (
    candidateYearOfExperience !== undefined &&
    candidateYearOfExperience !== ""
  ) {
    referralDataToUpdate.YearOfExperience = parseInt(
      candidateYearOfExperience,
      10,
    );
  }

  if (candidateEmail && candidateEmail !== candidate.Email) {
    candidateDataToUpdate.Email = candidateEmail;
  }

  if (cvFile) {
    // Delete old CV file for this referral if it exists
    if (referral.CVUrl) {
      try {
        // Extract filename from CVUrl (format: ${SUPABASE_URL}/storage/v1/object/public/cvs/${fileName})
        // Handle both full URL and relative path formats
        let oldFileName = referral.CVUrl;

        // If it's a full URL, extract just the filename
        if (referral.CVUrl.includes("/cvs/")) {
          const cvUrlParts = referral.CVUrl.split("/cvs/");
          if (cvUrlParts.length === 2) {
            oldFileName = cvUrlParts[1];
          }
        } else if (referral.CVUrl.includes("/")) {
          // If it's a path, get the last part (filename)
          oldFileName = referral.CVUrl.split("/").pop();
        }

        // Remove any query parameters if present
        oldFileName = oldFileName.split("?")[0];

        // Create authenticated Supabase client with access token
        // This is needed to satisfy the RLS policy that requires authentication
        const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          global: {
            headers: accessToken
              ? {
                  Authorization: `Bearer ${accessToken}`,
                }
              : {},
          },
        });

        // Delete the old CV file from Supabase
        const { data, error: deleteError } = await supabaseClient.storage
          .from("cvs")
          .remove([oldFileName]);

        if (deleteError) {
          console.error(`Failed to delete old CV file from Supabase:`, {
            fileName: oldFileName,
            error: deleteError.message,
            errorDetails: deleteError,
          });
          // Continue with upload even if deletion fails (non-critical)
        }
      } catch (error) {
        console.error(`Error deleting old CV file from Supabase:`, {
          cvUrl: referral.CVUrl,
          error: error.message,
          stack: error.stack,
        });
        // Continue with upload even if deletion fails (non-critical)
      }
    }

    // Generate filename from original filename + date
    let fileName;
    if (cvFileName) {
      // Extract filename without extension
      const originalName = cvFileName.replace(/\.(pdf|PDF)$/, "");
      // Sanitize filename: remove special characters, keep only alphanumeric, spaces, hyphens, underscores
      const sanitizedName = originalName
        .replace(/[^a-zA-Z0-9\s\-_]/g, "")
        .trim()
        .replace(/\s+/g, "-");
      // Format date as YYYY-MM-DD
      const dateStr = new Date().toISOString().split("T")[0];
      fileName = `${sanitizedName}-${dateStr}.pdf`;
    } else {
      // Fallback to old format if original filename is not available
      const fileExt = "pdf";
      fileName = `${candidateEmail || candidate.Email}-${Date.now()}.${fileExt}`;
    }
    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(fileName, cvFile, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      const error = new Error(`CV upload failed: ${uploadError.message}`);
      error.statusCode = 500;
      throw error;
    }

    referralDataToUpdate.CVUrl = `${SUPABASE_URL}/storage/v1/object/public/cvs/${fileName}`;
  }

  if (
    Object.keys(candidateDataToUpdate).length === 0 &&
    Object.keys(referralDataToUpdate).length === 0
  ) {
    const error = new Error("No valid fields to update");
    error.statusCode = 400;
    throw error;
  }

  const updatedCandidate = await prisma.$transaction(async (tx) => {
    if (candidateDataToUpdate.Email) {
      const existing = await tx.candidate.findUnique({
        where: { Email: candidateDataToUpdate.Email },
      });
      if (existing && existing.CandidateId !== candidate.CandidateId) {
        const error = new Error("Email is already used by another candidate");
        error.statusCode = 400;
        throw error;
      }
    }

    let updatedCandidateRecord = candidate;
    let updatedReferralRecord = referral;

    if (Object.keys(candidateDataToUpdate).length > 0) {
      updatedCandidateRecord = await tx.candidate.update({
        where: { CandidateId: candidate.CandidateId },
        data: candidateDataToUpdate,
      });
    }

    if (Object.keys(referralDataToUpdate).length > 0) {
      updatedReferralRecord = await tx.referral.update({
        where: { ReferralId: referral.ReferralId },
        data: referralDataToUpdate,
      });
    }

    return {
      updatedCandidate: updatedCandidateRecord,
      updatedReferral: updatedReferralRecord,
    };
  });

  if (candidateDataToUpdate.Email) {
    try {
      const resend = getResend();
      const frontendUrl = FRONTEND_URL;
      // Use this referral for the confirmation link
      const confirmationUrl = `${frontendUrl}/referral/confirm/${referral.ReferralId}`;

      await resend.emails.send({
        from: "no-reply@referra.space",
        to: candidateDataToUpdate.Email,
        subject: "Referral Confirmation Request",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hello ${candidateDataToUpdate.FirstName || candidate.FirstName} ${
              candidateDataToUpdate.LastName || candidate.LastName
            },</h2>
            <p>You have been referred for the position: <strong>${
              application.Position?.PositionTitle || "the position"
            }</strong></p>
            <p>Please click the link below to confirm your referral:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" 
                 style="background-color:rgb(76, 87, 175); color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Confirm Referral
              </a>
            <strong>This link will expire in 2 days.</strong>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="color: #666; word-break: break-all;">${confirmationUrl}</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("Failed to send confirmation email:", err);
    }
  }

  return updatedCandidate;
};

//employee referral history details backend
export const getEmployeeReferralDetails = async ({
  employeeId,
  referralId,
}) => {
  if (!employeeId) {
    const error = new Error("Employee ID is required");
    error.statusCode = 400;
    throw error;
  }

  if (!referralId) {
    const error = new Error("Referral ID is required");
    error.statusCode = 400;
    throw error;
  }

  const application = await prisma.application.findFirst({
    where: {
      ReferralId: referralId,
      EmployeeId: employeeId,
    },
    include: {
      Referral: true,
      Candidate: true,
      Position: true,
    },
  });

  if (!application) {
    const error = new Error("Referral not found");
    error.statusCode = 404;
    throw error;
  }

  return application;
};

export const findCandidateByEmail = async (email) => {
  if (!email) return null;

  const candidate = await prisma.candidate.findUnique({
    where: { Email: email },
    select: {
      CandidateId: true,
      FirstName: true,
      LastName: true,
      Email: true,
      PhoneNumber: true,
      Application: {
        orderBy: {
          Referral: { CreatedAt: "desc" },
        },
        take: 1,
        select: {
          Referral: {
            select: {
              YearOfExperience: true,
              CVUrl: true,
            },
          },
        },
      },
    },
  });

  if (!candidate) return null;

  const lastApplication = candidate.Application?.[0];
  const referralData = lastApplication?.Referral;

  return {
    CandidateId: candidate.CandidateId,
    FirstName: candidate.FirstName,
    LastName: candidate.LastName,
    Email: candidate.Email,
    PhoneNumber: candidate.PhoneNumber,
    YearOfExperience: referralData?.YearOfExperience ?? null,
    CVUrl: referralData?.CVUrl ?? null,
  };
};
