import { prisma } from "../../lib/prisma.js";

export const getAllConfirmedReferrals = async ({
  hrId,
  page = 1,
  pageSize = 10,
  search,
  status,
  createdAt,
  createdAfter,
}) => {
  if (!hrId) {
    throw new Error("HR ID is required");
  }

  const skip = (page - 1) * pageSize;

  const andFilters = [];

  andFilters.push({
    Position: {
      Department: {
        Hrs: {
          some: {
            HrId: hrId,
          },
        },
      },
    },
  });

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

  if (status === "Pending") {
    const error = new Error("Pending status is not allowed");
    error.statusCode = 400;
    throw error;
  }

  if (status) {
    andFilters.push({
      Referral: {
        Status: status,
      },
    });
  } else {
    andFilters.push({
      Referral: {
        Status: {
          not: "Pending",
        },
      },
    });
  }

  if (createdAt) {
    const startOfDay = new Date(createdAt);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(createdAt);
    endOfDay.setHours(23, 59, 59, 999);

    andFilters.push({
      Referral: {
        CreatedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
  }

  if (createdAfter) {
    andFilters.push({
      Referral: {
        CreatedAt: {
          gt: new Date(createdAfter),
        },
      },
    });
  }

  const where = { AND: andFilters };

  const total = await prisma.application.count({ where });

  const referrals = await prisma.application.findMany({
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
    orderBy: {
      Referral: { CreatedAt: "desc" },
    },
    skip,
    take: pageSize,
  });

  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
    referrals,
  };
};

const workflow = ["Confirmed", "InterviewOne", "InterviewTwo", "Acceptance"];

export const advanceReferralStage = async (referralId, hrUser) => {
  if (!referralId) throw new Error("Referral ID is required");

  const referral = await prisma.referral.findUnique({
    where: { ReferralId: referralId },
    include: {
      Application: {
        include: {
          Candidate: true,
          Position: {
            include: {
              Department: {
                include: {
                  Hrs: {
                    include: {
                      Hr: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!referral) throw new Error("Referral not found");

  const belongsToHrDept = referral.Application.Position.Department.Hrs.some(
    (hrDept) => hrDept.HrId === hrUser.HrId,
  );

  if (!belongsToHrDept)
    throw new Error("HR not allowed to update this referral");

  const currentIndex = workflow.indexOf(referral.Status);

  if (currentIndex === -1 || currentIndex === workflow.length - 1)
    throw new Error("Cannot advance referral further");

  const nextState = workflow[currentIndex + 1];

  await prisma.referral.update({
    where: { ReferralId: referralId },
    data: { Status: nextState },
  });

  const updatedApplication = await prisma.application.findUnique({
    where: { ReferralId: referralId },
    include: {
      Candidate: true,
      Referral: true,
    },
  });

  return updatedApplication;
};

export const finalizeReferral = async (
  referralId,
  action,
  hrUser,
  compensation,
) => {
  if (!referralId || !["Accept", "Prospect"].includes(action)) {
    throw new Error("Referral ID and valid action are required");
  }

  if (action === "Accept" && (!compensation || compensation <= 0)) {
    const err = new Error("Compensation amount is required for acceptance");
    err.statusCode = 400;
    throw err;
  }

  const referral = await prisma.referral.findUnique({
    where: { ReferralId: referralId },
    include: {
      Application: {
        include: {
          Candidate: true,
          Employee: true,
          Position: {
            include: {
              Department: {
                include: {
                  Hrs: {
                    include: {
                      Hr: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!referral) throw new Error("Referral not found");

  const belongsToHrDept = referral.Application.Position.Department.Hrs.some(
    (hrDept) => hrDept.HrId === hrUser.HrId,
  );

  if (!belongsToHrDept) {
    throw new Error("HR not allowed to update this referral");
  }

  const candidateId = referral.Application.Candidate.CandidateId;
  const employeeId = referral.Application.Employee.EmployeeId;

  if (action === "Accept") {
    if (referral.Status !== "Acceptance") {
      throw new Error("Can only accept candidate in last stage");
    }

    await prisma.$transaction([
      prisma.candidate.update({
        where: { CandidateId: candidateId },
        data: { Acceptance: true },
      }),

      prisma.referral.updateMany({
        where: {
          ReferralId: { not: referralId },
          Application: { CandidateId: candidateId },
        },
        data: {
          Status: "Acceptance",
          AcceptedInOtherPosition: true,
        },
      }),

      prisma.compensation.create({
        data: {
          HrId: hrUser.HrId,
          EmployeeId: employeeId,
          Amount: compensation,
        },
      }),

      prisma.employee.update({
        where: { EmployeeId: employeeId },
        data: {
          TotalCompensation: {
            increment: compensation,
          },
        },
      }),
    ]);
  }

  if (action === "Prospect") {
    await prisma.referral.update({
      where: { ReferralId: referralId },
      data: { Status: "Acceptance" },
    });
  }

  const updatedApplication = await prisma.application.findUnique({
    where: { ReferralId: referralId },
    include: {
      Candidate: true,
      Referral: true,
    },
  });
  return updatedApplication;
};
