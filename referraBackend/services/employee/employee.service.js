import { prisma } from "../../lib/prisma.js";
import { Resend } from "resend";
import { RESEND_API_KEY, FRONTEND_URL, SUPABASE_URL } from "../../config/env.js";
import { supabase } from "../../lib/supabase.js";

const getResend = () => {
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
    candidateYearOfExperience,
    positionId,
    employeeId,
    cvFile
  } = payload;

  if (
    !candidateFirstName ||
    !candidateLastName ||
    !candidateEmail ||
    !candidateYearOfExperience ||
    !positionId ||
    !employeeId ||
    !cvFile
  ) {
    const error = new Error(
      "candidateFirstName, candidateLastName, candidateEmail, candidateYearOfExperience, positionId, and cvFile are required",
    );
    error.statusCode = 400;
    throw error;
  }

  const position = await prisma.position.findUnique({
    where: { PositionId: positionId },
  });

  if (!position) {
    const error = new Error("Position not found");
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

  const employee = await prisma.employee.findUnique({
    where: { EmployeeId: employeeId },
  });

  if (!employee) {
    const error = new Error("Employee not found");
    error.statusCode = 404;
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
        "Application already exists for this candidate and position"
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
      from: 'no-reply@referra.space', 
      to: candidateEmail,
      subject: 'Referral Confirmation Request',
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
    console.error('Failed to send confirmation email:', emailError);
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
    const error = new Error("This referral confirmation link has expired. Please contact the person who referred you for a new link.");
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
export const deleteCandidate = async (candidateId, employeeId) => {
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

  const application = candidate.Application.find(
    (app) => app.EmployeeId === employeeId
  );

  if (!application) {
    const error = new Error("Application not found for this employee");
    error.statusCode = 404;
    throw error;
  }

  if (application.Referral.Status !== "Pending") {
    const error = new Error(
      `Cannot delete candidate. Referral status is ${application.Referral.Status}, not Pending`
    );
    error.statusCode = 400;
    throw error;
  }

  const allApplications = await prisma.application.findMany({
    where: {
      CandidateId: candidateId,
    },
  });

  const willDeleteCandidate = allApplications.length === 1; 

  const result = await prisma.$transaction(async (tx) => {
    await tx.application.delete({
      where: {
        ReferralId: application.ReferralId,
      },
    });

    await tx.referral.delete({
      where: {
        ReferralId: application.ReferralId,
      },
    });

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
<<<<<<< Updated upstream
};
=======
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

  const totalReferrals = await prisma.application.count({ where });

  const applications = await prisma.application.findMany({
    where,
    include: {
      Referral: true,
      Candidate: true,
      Position: true,
    },
    skip,
    take: pageSize,
    orderBy: {
      Referral: { CreatedAt: "desc" },
    },
  });

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
        where: { EmployeeId: employeeId },
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

  const application = candidate.Application[0];
  if (!application) {
    const error = new Error("Application not found for this employee");
    error.statusCode = 404;
    throw error;
  }

  if (application.Referral.Status !== "Pending") {
    const error = new Error(
      `Cannot edit candidate. Referral status is ${application.Referral.Status}, not Pending`,
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
>>>>>>> Stashed changes
