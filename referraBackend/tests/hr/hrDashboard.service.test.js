import test from "node:test";
import assert from "node:assert/strict";

import { getHrDashboard } from "../../services/hr/hrDashboard.service.js";
import { prisma } from "../../lib/prisma.js";

test("getHrDashboard returns aggregated stats for HR departments", async () => {
  const hr = {
    Departments: [{ DepartmentId: 1 }, { DepartmentId: 2 }],
  };

  const originalAppCount = prisma.application.count;
  const originalPosCount = prisma.position.count;
  const originalFindMany = prisma.application.findMany;

  prisma.application.count = async (args) => {
    const statusNot = args?.where?.Referral?.Status?.not;
    const statusIn = args?.where?.Referral?.Status?.in;
    const statusEq = args?.where?.Referral?.Status;

    // totalReferrals (non-pending)
    if (statusNot === "Pending") {
      return 10;
    }

    // pendingReviews (between Confirmed and Acceptance, non-prospect)
    if (Array.isArray(statusIn)) {
      return 4;
    }

    // successfulHires (Status = "Hired")
    if (statusEq === "Hired") {
      return 2;
    }

    return 0;
  };

  prisma.position.count = async () => 3; // open positions

  const fakeRecentReferrals = [
    { ApplicationId: 1 },
    { ApplicationId: 2 },
    { ApplicationId: 3 },
  ];

  prisma.application.findMany = async () => fakeRecentReferrals;

  try {
    const result = await getHrDashboard(hr);

    assert.equal(result.totalReferrals, 10);
    assert.equal(result.openPositions, 3);
    assert.equal(result.pendingReviews, 4);
    assert.equal(result.successfulHires, 2);
    assert.equal(result.recentReferrals.length, 3);
  } finally {
    prisma.application.count = originalAppCount;
    prisma.position.count = originalPosCount;
    prisma.application.findMany = originalFindMany;
  }
});

