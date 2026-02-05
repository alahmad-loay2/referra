import test from "node:test";
import assert from "node:assert/strict";

import {
  getAllConfirmedReferrals,
  getReferralDetails,
  advanceReferralStage,
  finalizeReferral,
} from "../../services/hr/hrReferrals.service.js";
import { prisma } from "../../lib/prisma.js";

test("getAllConfirmedReferrals returns paginated referrals for HR", async () => {
  const params = {
    hrId: 1,
    page: 2,
    pageSize: 5,
    search: "john",
    status: "Confirmed",
    createdAt: "2030-01-01",
    createdAfter: "2030-01-01T00:00:00.000Z",
    positionId: 10,
  };

  const fakeReferrals = [
    { ApplicationId: 1, ReferralId: 1 },
    { ApplicationId: 2, ReferralId: 2 },
  ];

  const originalCount = prisma.application.count;
  const originalFindMany = prisma.application.findMany;

  prisma.application.count = async () => 2;
  prisma.application.findMany = async (args) => {
    // basic sanity check on where/filter structure
    assert.ok(args.where.AND.length > 0);
    return fakeReferrals;
  };

  try {
    const result = await getAllConfirmedReferrals(params);

    assert.equal(result.page, 2);
    assert.equal(result.pageSize, 5);
    assert.equal(result.total, 2);
    assert.equal(result.totalPages, Math.ceil(2 / 5));
    assert.equal(result.referrals.length, 2);
  } finally {
    prisma.application.count = originalCount;
    prisma.application.findMany = originalFindMany;
  }
});

test("getReferralDetails returns referral when HR belongs to department", async () => {
  const referralId = 123;
  const hrId = 5;

  const fakeReferral = {
    ReferralId: referralId,
    Application: {
      Position: {
        Department: {
          Hrs: [{ HrId: hrId }],
        },
      },
    },
  };

  const originalFindUnique = prisma.referral.findUnique;

  prisma.referral.findUnique = async () => fakeReferral;

  try {
    const result = await getReferralDetails({ referralId, hrId });

    assert.deepEqual(result.referral, fakeReferral);
  } finally {
    prisma.referral.findUnique = originalFindUnique;
  }
});

test("advanceReferralStage advances referral to next stage when allowed", async () => {
  const referralId = 200;
  const hrUser = { HrId: 10 };

  const fakeReferral = {
    ReferralId: referralId,
    Status: "Confirmed",
    Prospect: false,
    AcceptedInOtherPosition: false,
    Application: {
      Position: {
        PositionState: "OPEN",
        Department: {
          Hrs: [{ HrId: hrUser.HrId }],
        },
      },
    },
  };

  const originalFindUnique = prisma.referral.findUnique;
  const originalUpdate = prisma.referral.update;

  let updateArgs;

  prisma.referral.findUnique = async () => fakeReferral;
  prisma.referral.update = async (args) => {
    updateArgs = args;
    return { ...fakeReferral, Status: "InterviewOne", Application: {} };
  };

  try {
    await advanceReferralStage(referralId, hrUser);

    assert.equal(updateArgs.where.ReferralId, referralId);
    assert.equal(updateArgs.data.Status, "InterviewOne");
  } finally {
    prisma.referral.findUnique = originalFindUnique;
    prisma.referral.update = originalUpdate;
  }
});

test("advanceReferralStage fails when referral is already at final stage or beyond", async () => {
  const referralId = 201;
  const hrUser = { HrId: 10 };

  const fakeReferral = {
    ReferralId: referralId,
    Status: "Hired",
    Prospect: false,
    AcceptedInOtherPosition: false,
    Application: {
      Position: {
        PositionState: "OPEN",
        Department: {
          Hrs: [{ HrId: hrUser.HrId }],
        },
      },
    },
  };

  const originalFindUnique = prisma.referral.findUnique;

  prisma.referral.findUnique = async () => fakeReferral;

  try {
    await assert.rejects(
      () => advanceReferralStage(referralId, hrUser),
      (err) => {
        assert.equal(err.message, "Cannot advance referral further");
        return true;
      },
    );
  } finally {
    prisma.referral.findUnique = originalFindUnique;
  }
});

test("advanceReferralStage fails when position is closed", async () => {
  const referralId = 202;
  const hrUser = { HrId: 10 };

  const fakeReferral = {
    ReferralId: referralId,
    Status: "Confirmed",
    Prospect: false,
    AcceptedInOtherPosition: false,
    Application: {
      Position: {
        PositionState: "CLOSED",
        Department: {
          Hrs: [{ HrId: hrUser.HrId }],
        },
      },
    },
  };

  const originalFindUnique = prisma.referral.findUnique;

  prisma.referral.findUnique = async () => fakeReferral;

  try {
    await assert.rejects(
      () => advanceReferralStage(referralId, hrUser),
      (err) => {
        assert.equal(err.message, "Cannot advance referral for a closed position");
        return true;
      },
    );
  } finally {
    prisma.referral.findUnique = originalFindUnique;
  }
});

test("advanceReferralStage fails when referral not in HR department", async () => {
  const referralId = 203;
  const hrUser = { HrId: 10 };

  const fakeReferral = {
    ReferralId: referralId,
    Status: "Confirmed",
    Prospect: false,
    AcceptedInOtherPosition: false,
    Application: {
      Position: {
        PositionState: "OPEN",
        Department: {
          Hrs: [{ HrId: 99 }], // different HR
        },
      },
    },
  };

  const originalFindUnique = prisma.referral.findUnique;

  prisma.referral.findUnique = async () => fakeReferral;

  try {
    await assert.rejects(
      () => advanceReferralStage(referralId, hrUser),
      (err) => {
        assert.equal(err.message, "HR not allowed to update this referral");
        return true;
      },
    );
  } finally {
    prisma.referral.findUnique = originalFindUnique;
  }
});

test("advanceReferralStage fails when referral is already a prospect", async () => {
  const referralId = 204;
  const hrUser = { HrId: 10 };

  const fakeReferral = {
    ReferralId: referralId,
    Status: "Confirmed",
    Prospect: true,
    AcceptedInOtherPosition: false,
    Application: {
      Position: {
        PositionState: "OPEN",
        Department: {
          Hrs: [{ HrId: hrUser.HrId }],
        },
      },
    },
  };

  const originalFindUnique = prisma.referral.findUnique;

  prisma.referral.findUnique = async () => fakeReferral;

  try {
    await assert.rejects(
      () => advanceReferralStage(referralId, hrUser),
      (err) => {
        assert.equal(
          err.message,
          "Cannot advance referral stage when Prospect is true",
        );
        return true;
      },
    );
  } finally {
    prisma.referral.findUnique = originalFindUnique;
  }
});

test("advanceReferralStage fails when candidate was accepted in other position", async () => {
  const referralId = 205;
  const hrUser = { HrId: 10 };

  const fakeReferral = {
    ReferralId: referralId,
    Status: "Confirmed",
    Prospect: false,
    AcceptedInOtherPosition: true,
    Application: {
      Position: {
        PositionState: "OPEN",
        Department: {
          Hrs: [{ HrId: hrUser.HrId }],
        },
      },
    },
  };

  const originalFindUnique = prisma.referral.findUnique;

  prisma.referral.findUnique = async () => fakeReferral;

  try {
    await assert.rejects(
      () => advanceReferralStage(referralId, hrUser),
      (err) => {
        assert.equal(
          err.message,
          "Cannot advance referral stage when AcceptedInOtherPosition is true",
        );
        return true;
      },
    );
  } finally {
    prisma.referral.findUnique = originalFindUnique;
  }
});

test("finalizeReferral Prospects candidate even when position is closed", async () => {
  const referralId = 300;
  const hrUser = { HrId: 10 };

  const fakeReferral = {
    ReferralId: referralId,
    Status: "Confirmed",
    Prospect: false,
    AcceptedInOtherPosition: false,
    Application: {
      Position: {
        PositionState: "CLOSED",
        Department: {
          Hrs: [{ HrId: hrUser.HrId }],
        },
      },
    },
  };

  const originalFindUnique = prisma.referral.findUnique;
  const originalUpdate = prisma.referral.update;
  const originalAppFind = prisma.application.findUnique;

  let updateArgs;

  prisma.referral.findUnique = async () => fakeReferral;
  prisma.referral.update = async (args) => {
    updateArgs = args;
    return { ...fakeReferral, Prospect: true };
  };

  prisma.application.findUnique = async () => ({
    ApplicationId: 1,
    ReferralId: referralId,
  });

  try {
    const result = await finalizeReferral(referralId, "Prospect", hrUser);

    assert.equal(updateArgs.where.ReferralId, referralId);
    assert.equal(updateArgs.data.Prospect, true);
    assert.equal(result.ReferralId, referralId);
  } finally {
    prisma.referral.findUnique = originalFindUnique;
    prisma.referral.update = originalUpdate;
    prisma.application.findUnique = originalAppFind;
  }
});

test("finalizeReferral Accept performs hire workflow and marks other referrals", async () => {
  const referralId = 301;
  const hrUser = { HrId: 10 };

  const fakeReferral = {
    ReferralId: referralId,
    Status: "Acceptance",
    Prospect: false,
    AcceptedInOtherPosition: false,
    Application: {
      Candidate: { CandidateId: 7 },
      Employee: { EmployeeId: 8 },
      PositionId: 9,
      Position: {
        PositionState: "OPEN",
        Department: {
          Hrs: [{ HrId: hrUser.HrId }],
        },
      },
    },
  };

  const otherApplications = [
    { ReferralId: 400 },
    { ReferralId: 401 },
  ];

  const originalFindUnique = prisma.referral.findUnique;
  const originalFindMany = prisma.application.findMany;
  const originalTx = prisma.$transaction;
  const originalRefUpdate = prisma.referral.update;
  const originalCandUpdate = prisma.candidate.update;
  const originalCompCreate = prisma.compensation.create;
  const originalEmpUpdate = prisma.employee.update;
  const originalRefUpdateMany = prisma.referral.updateMany;
  const originalAppFind = prisma.application.findUnique;

  const calls = {
    referralUpdate: null,
    candidateUpdate: null,
    compensationCreate: null,
    employeeUpdate: null,
    referralUpdateMany: null,
  };

  prisma.referral.findUnique = async () => fakeReferral;
  prisma.application.findMany = async () => otherApplications;

  prisma.referral.update = async (args) => {
    calls.referralUpdate = args;
    return {};
  };
  prisma.candidate.update = async (args) => {
    calls.candidateUpdate = args;
    return {};
  };
  prisma.compensation.create = async (args) => {
    calls.compensationCreate = args;
    return {};
  };
  prisma.employee.update = async (args) => {
    calls.employeeUpdate = args;
    return {};
  };
  prisma.referral.updateMany = async (args) => {
    calls.referralUpdateMany = args;
    return {};
  };

  prisma.$transaction = async (ops) => {
    await Promise.all(ops);
  };

  prisma.application.findUnique = async () => ({
    ApplicationId: 999,
    ReferralId: referralId,
  });

  try {
    const result = await finalizeReferral(referralId, "Accept", hrUser, 100);

    // Ensure final application is returned
    assert.equal(result.ReferralId, referralId);

    // Referral updated to Hired
    assert.equal(calls.referralUpdate.where.ReferralId, referralId);
    assert.equal(calls.referralUpdate.data.Status, "Hired");

    // Candidate acceptance set to true
    assert.equal(calls.candidateUpdate.where.CandidateId, 7);
    assert.equal(calls.candidateUpdate.data.Acceptance, true);

    // Compensation created and employee total incremented
    assert.equal(calls.compensationCreate.data.HrId, hrUser.HrId);
    assert.equal(calls.compensationCreate.data.EmployeeId, 8);
    assert.equal(calls.compensationCreate.data.Amount, 100);
    assert.equal(calls.employeeUpdate.where.EmployeeId, 8);
    assert.deepEqual(calls.employeeUpdate.data.TotalCompensation.increment, 100);

    // Other referrals marked as AcceptedInOtherPosition
    assert.deepEqual(
      calls.referralUpdateMany.where.ReferralId.in,
      otherApplications.map((a) => a.ReferralId),
    );
    assert.equal(
      calls.referralUpdateMany.data.AcceptedInOtherPosition,
      true,
    );
  } finally {
    prisma.referral.findUnique = originalFindUnique;
    prisma.application.findMany = originalFindMany;
    prisma.$transaction = originalTx;
    prisma.referral.update = originalRefUpdate;
    prisma.candidate.update = originalCandUpdate;
    prisma.compensation.create = originalCompCreate;
    prisma.employee.update = originalEmpUpdate;
    prisma.referral.updateMany = originalRefUpdateMany;
    prisma.application.findUnique = originalAppFind;
  }
});

test("finalizeReferral Accept fails when position is closed", async () => {
  const referralId = 302;
  const hrUser = { HrId: 10 };

  const fakeReferral = {
    ReferralId: referralId,
    Status: "Acceptance",
    Prospect: false,
    AcceptedInOtherPosition: false,
    Application: {
      Candidate: { CandidateId: 7 },
      Employee: { EmployeeId: 8 },
      PositionId: 9,
      Position: {
        PositionState: "CLOSED",
        Department: {
          Hrs: [{ HrId: hrUser.HrId }],
        },
      },
    },
  };

  const originalFindUnique = prisma.referral.findUnique;

  prisma.referral.findUnique = async () => fakeReferral;

  try {
    await assert.rejects(
      () => finalizeReferral(referralId, "Accept", hrUser, 100),
      (err) => {
        assert.equal(err.message, "Cannot accept candidate for a closed position");
        return true;
      },
    );
  } finally {
    prisma.referral.findUnique = originalFindUnique;
  }
});

test("finalizeReferral fails when HR is not in department", async () => {
  const referralId = 303;
  const hrUser = { HrId: 10 };

  const fakeReferral = {
    ReferralId: referralId,
    Status: "Acceptance",
    Prospect: false,
    AcceptedInOtherPosition: false,
    Application: {
      Candidate: { CandidateId: 7 },
      Employee: { EmployeeId: 8 },
      PositionId: 9,
      Position: {
        PositionState: "OPEN",
        Department: {
          Hrs: [{ HrId: 999 }], // different HR
        },
      },
    },
  };

  const originalFindUnique = prisma.referral.findUnique;

  prisma.referral.findUnique = async () => fakeReferral;

  try {
    await assert.rejects(
      () => finalizeReferral(referralId, "Accept", hrUser, 100),
      (err) => {
        assert.equal(err.message, "HR not allowed to update this referral");
        return true;
      },
    );
  } finally {
    prisma.referral.findUnique = originalFindUnique;
  }
});
