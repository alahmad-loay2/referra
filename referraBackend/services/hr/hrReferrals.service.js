import { prisma } from "../../lib/prisma.js";

// how it works:
// candidates can be in multiple referrals.
// referrals have stages and have accepted in other position flag. if accepted in other position,
// the candidate is accepted, and accepted in other position flag is true, and all referrals become acceptance stage.
// if candidate is accepted but the referral have accepted in other position flag as false, then candidate is accepted in this referral.

// get all confirmed referrals for an hr with filters on department and status and pagination and search
// positionId is the id of the position to filter by
// status is the status of the referral to filter by
// createdAt is the date to filter by
// createdAfter is the date to filter by for polling
// search is the search term to filter by
// page is the page number to filter by
// pageSize is the page size to filter by

export const getAllConfirmedReferrals = async ({
  hrId,
  page = 1,
  pageSize = 10,
  search,
  status,
  createdAt,
  createdAfter,
  positionId,
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

  if (positionId) {
    andFilters.push({
      PositionId: positionId,
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

// get details of a specific referral for an hr

export const getReferralDetails = async ({ referralId, hrId }) => {
  if (!referralId) throw new Error("Referral ID is required");
  if (!hrId) throw new Error("HR ID is required");

  const referral = await prisma.referral.findUnique({
    where: { ReferralId: referralId },
    include: {
      Application: {
        include: {
          Candidate: true,
          Employee: {
            include: {
              User: true,
            },
          },
          Position: {
            include: {
              Department: {
                include: {
                  Hrs: { include: { Hr: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!referral) throw new Error("Referral not found");

  const application = referral.Application;

  const belongsToHrDept = application.Position.Department.Hrs.some(
    (hrDept) => hrDept.HrId === hrId,
  );

  if (!belongsToHrDept) {
    throw new Error("HR not allowed to view this referral");
  }

  return {
    referral,
  };
};

const workflow = ["Confirmed", "InterviewOne", "InterviewTwo", "Acceptance"];

// advance the stage of a referral
// HR can only advance from Confirmed to Acceptance (stops at Acceptance, cannot advance to Hired)
// If Prospect is true, cannot advance to next stage
// If AcceptedInOtherPosition is true, cannot advance

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

  // Check if Prospect is true - cannot advance if it is
  if (referral.Prospect) {
    throw new Error("Cannot advance referral stage when Prospect is true");
  }

  // Check if AcceptedInOtherPosition is true - cannot advance if it is
  if (referral.AcceptedInOtherPosition) {
    throw new Error("Cannot advance referral stage when AcceptedInOtherPosition is true");
  }

  const currentIndex = workflow.indexOf(referral.Status);

  if (currentIndex === -1 || currentIndex === workflow.length - 1)
    throw new Error("Cannot advance referral further");

  const nextState = workflow[currentIndex + 1];

  // Just update the status (can only go up to Acceptance)
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

// finalize a referral (accept or prospect)
// Prospect: sets Prospect to true, can be done at any time (except if Hired or AcceptedInOtherPosition), doesn't change status
// Accept: moves from Acceptance to Hired, sets candidate acceptance to true, marks other referrals for same position, compensates employee
// compensation is required for Accept (even if 0)
// Cannot accept if Prospect is true
// Cannot accept if AcceptedInOtherPosition is true
export const finalizeReferral = async (
  referralId,
  action,
  hrUser,
  compensation,
) => {
  if (!referralId || !["Accept", "Prospect"].includes(action)) {
    throw new Error("Referral ID and valid action are required");
  }

  if (action === "Accept" && (compensation === undefined || compensation === null || compensation < 0)) {
    const err = new Error("Compensation amount is required for acceptance (can be 0)");
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
  const positionId = referral.Application.PositionId;

  if (action === "Accept") {
    if (referral.Status !== "Acceptance") {
      throw new Error("Can only accept candidate in Acceptance stage");
    }

    // Cannot accept if Prospect is true
    if (referral.Prospect) {
      throw new Error("Cannot accept candidate who is a prospect");
    }

    // Cannot accept if AcceptedInOtherPosition is true
    if (referral.AcceptedInOtherPosition) {
      throw new Error("Cannot accept candidate who is accepted in other position");
    }

    // Find all other referral IDs for this candidate
    const otherApplications = await prisma.application.findMany({
      where: {
        CandidateId: candidateId,
        ReferralId: { not: referralId },
      },
      select: {
        ReferralId: true,
      },
    });

    const otherReferralIds = otherApplications.map((app) => app.ReferralId);

    const transactionOperations = [
      // Update the referral to Hired
      prisma.referral.update({
        where: { ReferralId: referralId },
        data: { Status: "Hired" },
      }),
      // Set candidate acceptance to true
      prisma.candidate.update({
        where: { CandidateId: candidateId },
        data: { Acceptance: true },
      }),
      // Compensate the employee
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
    ];

    // Mark all other referrals for this candidate as AcceptedInOtherPosition (but keep their status)
    if (otherReferralIds.length > 0) {
      transactionOperations.push(
        prisma.referral.updateMany({
          where: {
            ReferralId: { in: otherReferralIds },
          },
          data: {
            AcceptedInOtherPosition: true,
          },
        }),
      );
    }

    await prisma.$transaction(transactionOperations);
  }

  if (action === "Prospect") {
    // Cannot prospect if already Hired
    if (referral.Status === "Hired") {
      throw new Error("Cannot prospect candidate who is already hired");
    }

    // Cannot prospect if AcceptedInOtherPosition is true
    if (referral.AcceptedInOtherPosition) {
      throw new Error("Cannot prospect candidate who is accepted in other position");
    }

    // Just set Prospect to true, don't change status
    await prisma.referral.update({
      where: { ReferralId: referralId },
      data: { Prospect: true },
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
