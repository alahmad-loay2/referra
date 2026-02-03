import { prisma } from "../../lib/prisma.js";

/**
 * Get HR Dashboard Stats
 * Returns:
 * - totalReferrals: Total number of referrals (non-pending) for HR's departments
 * - openPositions: Number of open positions for HR's departments
 * - pendingReviews: Number of referrals between Confirmed and Acceptance stage that aren't prospect
 * - successfulHires: Number of hired referrals for HR's departments
 * - recentReferrals: 3 most recent referrals
 */
export const getHrDashboard = async (hr) => {
  if (!hr?.Departments || hr.Departments.length === 0) {
    const error = new Error("HR has no assigned departments");
    error.statusCode = 403;
    throw error;
  }

  const departmentIds = hr.Departments.map((d) => d.DepartmentId);

  // Base filter for HR's departments
  const departmentFilter = {
    Position: {
      DepartmentId: {
        in: departmentIds,
      },
    },
  };

  // Run all queries in parallel for maximum performance
  const [
    totalReferrals,
    openPositions,
    pendingReviews,
    successfulHires,
    recentReferrals,
  ] = await Promise.all([
    // Get total referrals (non-pending) for HR's departments
    prisma.application.count({
      where: {
        ...departmentFilter,
        Referral: {
          Status: {
            not: "Pending",
          },
        },
      },
    }),
    // Get open positions for HR's departments
    prisma.position.count({
      where: {
        DepartmentId: {
          in: departmentIds,
        },
        PositionState: "OPEN",
      },
    }),
    // Get pending reviews: referrals between Confirmed and Acceptance stage that aren't prospect
    prisma.application.count({
      where: {
        ...departmentFilter,
        Referral: {
          Status: {
            in: ["Confirmed", "InterviewOne", "InterviewTwo", "Acceptance"],
          },
          Prospect: false,
        },
      },
    }),
    // Get successful hires: referrals with Status = "Hired" for HR's departments
    prisma.application.count({
      where: {
        ...departmentFilter,
        Referral: {
          Status: "Hired",
        },
      },
    }),
    // Get recent referrals (3 most recent, non-pending)
    prisma.application.findMany({
      where: {
        ...departmentFilter,
        Referral: {
          Status: {
            not: "Pending",
          },
        },
      },
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
        Referral: {
          CreatedAt: "desc",
        },
      },
      take: 3,
    }),
  ]);

  return {
    totalReferrals,
    openPositions,
    pendingReviews,
    successfulHires,
    recentReferrals,
  };
};
