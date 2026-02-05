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
  if (process.env.NODE_ENV === "test") {
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
  } = payload;

  if (
    !candidateFirstName ||
    !candidateLastName ||
    !candidateEmail ||
    !candidatePhoneNumber ||
    !candidateYearOfExperience ||
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

  // Run position and employee lookups in parallel
  const [position, employee] = await Promise.all([
    prisma.position.findUnique({
      where: { PositionId: positionId },
    }),
    prisma.employee.findUnique({
      where: { EmployeeId: employeeId },
    }),
  ]);

  if (!position) {
    const error = new Error("Position not found");
    error.statusCode = 404;
    throw error;
  }

  if (!employee) {
    const error = new Error("Employee not found");
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();

  // 🔒 HARD BLOCK expired or closed positions
  if (position.PositionState !== "OPEN" || position.Deadline < now) {
    // Optional: auto-close immediately
    if (position.PositionState === "OPEN" && position.Deadline < now) {
      await prisma.position.update({
        where: { PositionId: positionId },
        data: { PositionState: "CLOSED" },
      });
    }

    const error = new Error("This position is closed or has expired");
    error.statusCode = 400;
    throw error;
  }

  let candidate = await prisma.candidate.findUnique({
    where: { Email: candidateEmail },
  });

  if (candidate) {
    const existingApplication = await prisma.application.findFirst({
      where: {
        EmployeeId: employeeId,
        CandidateId: candidate.CandidateId,
        PositionId: positionId,
      },
    });

    if (existingApplication) {
      const error = new Error(
        "Application already exists for this candidate and position",
      );
      error.statusCode = 400;
      throw error;
    }
  }

  // Upload CV to Supabase first
  const fileExt = "pdf";
  const fileName = `${candidateEmail}-${Date.now()}.${fileExt}`;

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

  const result = await prisma.$transaction(async (tx) => {
    if (!candidate) {
      candidate = await tx.candidate.create({
        data: {
          FirstName: candidateFirstName,
          LastName: candidateLastName,
          Email: candidateEmail,
          YearOfExperience: parseInt(candidateYearOfExperience, 10),
          PhoneNumber: candidatePhoneNumber,
          CVUrl: cvUrl,
        },
      });
    } else {
      // Update existing candidate's CV
      candidate = await tx.candidate.update({
        where: { CandidateId: candidate.CandidateId },
        data: { CVUrl: cvUrl },
      });
    }

    const referral = await tx.referral.create({
      data: {
        Status: "Pending",
        AcceptedInOtherPosition: false,
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

  return result;
};

// candidate confirms referral using referralId
export const confirmReferral = async (referralId) => {
  if (!referralId) {
    const error = new Error("Referral ID is required");
    error.statusCode = 400;
    throw error;
  }

  const referral = await prisma.referral.findUnique({
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

  const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
  const referralAge = Date.now() - new Date(referral.CreatedAt).getTime();

  if (referralAge > twoDaysInMs) {
    const error = new Error(
      "This referral confirmation link has expired. Please contact the person who referred you for a new link.",
    );
    error.statusCode = 410;
    throw error;
  }

  const updatedReferral = await prisma.referral.update({
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

  // Find the application by referralId and employeeId
  const application = await prisma.application.findFirst({
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

  // Only allow deletion if this specific referral is Pending
  if (application.Referral.Status !== "Pending") {
    const error = new Error(
      `Cannot delete application. Referral status is ${application.Referral.Status}, not Pending`,
    );
    error.statusCode = 400;
    throw error;
  }

  // Check if candidate has any other referrals that are Confirmed or above
  // Statuses: Pending < Confirmed < InterviewOne < InterviewTwo < Acceptance
  const statusOrder = [
    "Pending",
    "Confirmed",
    "InterviewOne",
    "InterviewTwo",
    "Acceptance",
  ];
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

  // Delete CV file from Supabase if we're deleting the candidate
  if (willDeleteCandidate && candidate.CVUrl) {
    try {
      // Extract filename from CVUrl (format: ${SUPABASE_URL}/storage/v1/object/public/cvs/${fileName})
      // Handle both full URL and relative path formats
      let fileName = candidate.CVUrl;

      // If it's a full URL, extract just the filename
      if (candidate.CVUrl.includes("/cvs/")) {
        const cvUrlParts = candidate.CVUrl.split("/cvs/");
        if (cvUrlParts.length === 2) {
          fileName = cvUrlParts[1];
        }
      } else if (candidate.CVUrl.includes("/")) {
        // If it's a path, get the last part (filename)
        fileName = candidate.CVUrl.split("/").pop();
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
        cvUrl: candidate.CVUrl,
        error: error.message,
        stack: error.stack,
      });
      // Continue with deletion even if file deletion fails
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    // Always delete the application and referral (if Pending)
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

    // Only delete candidate if they have no other referrals that are Confirmed or above
    if (willDeleteCandidate) {
      await tx.candidate.delete({
        where: {
          CandidateId: candidateId,
        },
      });
    }

    return { deletedCandidate: willDeleteCandidate };
  });

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
    candidateId,
    employeeId,
    candidateFirstName,
    candidateLastName,
    candidateEmail,
    candidatePhoneNumber,
    candidateYearOfExperience,
    cvFile,
  } = payload;

  if (!candidateId) {
    const error = new Error("Candidate ID is required");
    error.statusCode = 400;
    throw error;
  }
  if (!employeeId) {
    const error = new Error("Employee ID is required");
    error.statusCode = 400;
    throw error;
  }

  const candidate = await prisma.candidate.findUnique({
    where: { CandidateId: candidateId },
    include: {
      Application: {
        include: {
          Referral: true,
          Position: true,
          Employee: true,
        },
      },
    },
  });

  if (!candidate) {
    const error = new Error("Candidate not found");
    error.statusCode = 404;
    throw error;
  }

  // Find the specific application for this employee
  const application = candidate.Application.find(
    (app) => app.EmployeeId === employeeId,
  );

  if (!application) {
    const error = new Error("Application not found for this employee");
    error.statusCode = 404;
    throw error;
  }

  // Check if THIS specific referral is Pending
  if (application.Referral.Status !== "Pending") {
    const error = new Error(
      `Cannot edit candidate. Referral status is ${application.Referral.Status}, not Pending`,
    );
    error.statusCode = 400;
    throw error;
  }

  // Check if candidate has ANY other referral that is NOT Pending
  // If they have any referral that is Confirmed or above, don't allow edit
  const statusOrder = [
    "Pending",
    "Confirmed",
    "InterviewOne",
    "InterviewTwo",
    "Acceptance",
  ];
  const hasNonPendingReferral = candidate.Application.some((app) => {
    // Skip the current application we're editing
    if (app.ReferralId === application.ReferralId) {
      return false;
    }
    const statusIndex = statusOrder.indexOf(app.Referral.Status);
    const pendingIndex = statusOrder.indexOf("Pending");
    return statusIndex > pendingIndex;
  });

  if (hasNonPendingReferral) {
    const error = new Error(
      "Cannot edit candidate. Candidate has other referrals that are not Pending",
    );
    error.statusCode = 400;
    throw error;
  }

  const dataToUpdate = {};
  if (candidateFirstName !== undefined && candidateFirstName !== "") {
    dataToUpdate.FirstName = candidateFirstName;
  }
  if (candidateLastName !== undefined && candidateLastName !== "") {
    dataToUpdate.LastName = candidateLastName;
  }
  if (candidatePhoneNumber !== undefined && candidatePhoneNumber !== "") {
    dataToUpdate.PhoneNumber = candidatePhoneNumber;
  }
  if (
    candidateYearOfExperience !== undefined &&
    candidateYearOfExperience !== ""
  ) {
    dataToUpdate.YearOfExperience = parseInt(candidateYearOfExperience, 10);
  }

  if (candidateEmail && candidateEmail !== candidate.Email) {
    const existing = await prisma.candidate.findUnique({
      where: { Email: candidateEmail },
    });
    if (existing) {
      const error = new Error("Email is already used by another candidate");
      error.statusCode = 400;
      throw error;
    }
    dataToUpdate.Email = candidateEmail;
  }

  if (cvFile) {
    const fileExt = "pdf";
    const fileName = `${candidateEmail || candidate.Email}-${Date.now()}.${fileExt}`;
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

    dataToUpdate.CVUrl = `${SUPABASE_URL}/storage/v1/object/public/cvs/${fileName}`;
  }

  if (Object.keys(dataToUpdate).length === 0) {
    const error = new Error("No valid fields to update");
    error.statusCode = 400;
    throw error;
  }

  const updatedCandidate = await prisma.$transaction(async (tx) => {
    return await tx.candidate.update({
      where: { CandidateId: candidateId },
      data: dataToUpdate,
    });
  });

  if (dataToUpdate.Email) {
    try {
      const resend = getResend();
      const frontendUrl = FRONTEND_URL;
      const confirmationUrl = `${frontendUrl}/referral/confirm/${application.Referral.ReferralId}`;

      await resend.emails.send({
        from: "no-reply@referra.space",
        to: dataToUpdate.Email,
        subject: "Referral Confirmation Request",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hello ${dataToUpdate.FirstName || candidate.FirstName} ${dataToUpdate.LastName || candidate.LastName},</h2>
            <p>You have been referred for the position: <strong>${application.Position?.PositionTitle || "the position"}</strong></p>
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

  return { updatedCandidate };
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

  return prisma.candidate.findUnique({
    where: { Email: email },
    select: {
      CandidateId: true,
      FirstName: true,
      LastName: true,
      Email: true,
    },
  });
};
