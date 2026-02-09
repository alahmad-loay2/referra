import { prisma } from "../../lib/prisma.js";

export const getEmployeeDashboard = async (employeeId) => {
  if (!employeeId) {
    const error = new Error("Employee ID is required");
    error.statusCode = 400;
    throw error;
  }

  const [
    totalReferrals,
    pendingReviews,
    successfulHires,
    bonuses,
    recentReferrals,
    recentPositions,
  ] = await Promise.all([
    // Total referrals
    prisma.application.count({
      where: { EmployeeId: employeeId },
    }),

    // Pending reviews
    prisma.application.count({
      where: {
        EmployeeId: employeeId,
        Referral: { Status: "Pending" },
      },
    }),

    // Successful hires
    prisma.application.count({
      where: {
        EmployeeId: employeeId,
        Referral: { Status: "Hired" },
      },
    }),

    // Bonuses (example logic)
    prisma.compensation.aggregate({
      where: { EmployeeId: employeeId },
      _sum: { Amount: true },
    }),

    // Recent referrals (last 3)
    prisma.application.findMany({
      where: { EmployeeId: employeeId },
      include: {
        Candidate: true,
        Referral: true,
      },
      orderBy: {
        Referral: { CreatedAt: "desc" },
      },
      take: 3,
    }),

    // Recent open positions (reuse logic)
    prisma.position.findMany({
      where: {
        PositionState: "OPEN",
        Deadline: { gt: new Date() },
      },
      include: { Department: true },
      orderBy: { CreatedAt: "desc" },
      take: 3,
    }),
  ]);

  return {
    stats: {
      totalReferrals,
      pendingReviews,
      successfulHires,
      earnedBonuses: bonuses._sum.Amount || 0,
    },
    recentReferrals,
    recentPositions,
  };
};
