import test from "node:test";
import assert from "node:assert/strict";

import {
  createReferral,
  confirmReferral,
  deleteCandidate,
  getEmployeeReferrals,
  editCandidate,
  getEmployeeReferralDetails,
} from "../../../services/employee/employeeReferrals.service.js";
import { prisma } from "../../../lib/prisma.js";
import { supabase } from "../../../lib/supabase.js";
import { createClient } from "@supabase/supabase-js";

test("createReferral creates candidate, referral and application for open position", async () => {
  const payload = {
    candidateFirstName: "John",
    candidateLastName: "Doe",
    candidateEmail: "john@example.com",
    candidatePhoneNumber: "+11234567890",
    candidateYearOfExperience: 5,
    positionId: 10,
    employeeId: 20,
    cvFile: Buffer.from("fake-pdf"),
  };

  const position = {
    PositionId: 10,
    PositionState: "OPEN",
    Deadline: new Date(Date.now() + 86400000),
  };

  const employee = {
    EmployeeId: 20,
  };

  const originalPosFind = prisma.position.findUnique;
  const originalEmpFind = prisma.employee.findUnique;
  const originalCandFind = prisma.candidate.findUnique;
  const originalStorage = supabase.storage;
  const originalTx = prisma.$transaction;

  let createdCandidate = null;
  let createdReferral = null;
  let createdApplication = null;

  prisma.position.findUnique = async () => position;
  prisma.employee.findUnique = async () => employee;
  prisma.candidate.findUnique = async () => null;

  supabase.storage = {
    from: () => ({
      upload: async () => ({ data: {}, error: null }),
    }),
  };

  prisma.$transaction = async (fn) => {
    const tx = {
      position: {
        findUnique: async () => position,
        update: async () => position, // For auto-closing expired positions
      },
      employee: {
        findUnique: async () => employee,
      },
      candidate: {
        findUnique: async ({ where, include }) => {
          // Return null for new candidate (email doesn't exist)
          return null;
        },
        create: async ({ data }) => {
          createdCandidate = { CandidateId: 1, ...data };
          return createdCandidate;
        },
        update: async () => {
          throw new Error("should not be called in this test");
        },
      },
      referral: {
        create: async ({ data }) => {
          createdReferral = { ReferralId: 100, ...data };
          return createdReferral;
        },
      },
      application: {
        create: async ({ data }) => {
          createdApplication = {
            ApplicationId: 200,
            ...data,
            Referral: createdReferral,
            Candidate: createdCandidate,
            Employee: employee,
            Position: position,
          };
          return createdApplication;
        },
      },
    };
    return fn(tx);
  };

  try {
    const result = await createReferral(payload);

    assert.equal(result.ApplicationId, 200);
    assert.equal(result.Candidate.CandidateId, 1);
    assert.equal(result.Candidate.PhoneNumber, "+11234567890");
    assert.equal(result.Position.PositionId, 10);
    assert.equal(result.Referral.ReferralId, 100);
  } finally {
    prisma.position.findUnique = originalPosFind;
    prisma.employee.findUnique = originalEmpFind;
    prisma.candidate.findUnique = originalCandFind;
    supabase.storage = originalStorage;
    prisma.$transaction = originalTx;
  }
});

test("confirmReferral updates referral from Pending to Confirmed within time window", async () => {
  const referralId = 500;

  const now = new Date();

  const pendingReferral = {
    ReferralId: referralId,
    Status: "Pending",
    CreatedAt: now.toISOString(),
    Application: {
      Candidate: {},
      Position: {
        PositionState: "OPEN",
      },
    },
  };

  const originalTx = prisma.$transaction;

  let updateArgs;

  prisma.$transaction = async (fn) => {
    const tx = {
      referral: {
        findUnique: async () => pendingReferral,
        update: async (args) => {
          updateArgs = args;
          return {
            ...pendingReferral,
            Status: "Confirmed",
            Application: {
              Candidate: {},
              Position: {},
              Employee: {
                User: {},
              },
            },
          };
        },
      },
    };
    return fn(tx);
  };

  try {
    const result = await confirmReferral(referralId);

    assert.equal(updateArgs.where.ReferralId, referralId);
    assert.equal(updateArgs.data.Status, "Confirmed");
    assert.equal(result.Status, "Confirmed");
  } finally {
    prisma.$transaction = originalTx;
  }
});

test("confirmReferral fails when position is closed", async () => {
  const referralId = 501;

  const now = new Date();

  const pendingReferralWithClosedPosition = {
    ReferralId: referralId,
    Status: "Pending",
    CreatedAt: now.toISOString(),
    Application: {
      Candidate: {},
      Position: {
        PositionId: 10,
        PositionState: "CLOSED",
      },
    },
  };

  const originalTx = prisma.$transaction;

  prisma.$transaction = async (fn) => {
    const tx = {
      referral: {
        findUnique: async () => pendingReferralWithClosedPosition,
        update: async () => {
          throw new Error("should not be called");
        },
      },
    };
    return fn(tx);
  };

  try {
    await assert.rejects(
      () => confirmReferral(referralId),
      (err) => {
        assert.equal(
          err.message,
          "Cannot confirm referral for a closed position. Please contact the person who referred you or HR.",
        );
        assert.equal(err.statusCode, 400);
        return true;
      },
    );
  } finally {
    prisma.$transaction = originalTx;
  }
});

test("deleteCandidate removes application and referral but keeps candidate when there are other applications", async () => {
  const referralId = 600;
  const employeeId = 30;

  const candidate = {
    CandidateId: 7,
    CVUrl: null,
    Application: [
      {
        ReferralId: referralId,
        Referral: { Status: "Pending" },
      },
      {
        ReferralId: 601,
        Referral: { Status: "Confirmed" },
      },
    ],
  };

  const application = {
    ReferralId: referralId,
    EmployeeId: employeeId,
    Referral: { Status: "Pending" },
    Candidate: candidate,
  };

  const originalTx = prisma.$transaction;

  const deleted = {
    application: false,
    referral: false,
    candidate: false,
  };

  prisma.$transaction = async (fn) => {
    const tx = {
      application: {
        findFirst: async () => application,
        delete: async ({ where }) => {
          if (where.ReferralId === referralId) deleted.application = true;
        },
      },
      referral: {
        delete: async ({ where }) => {
          if (where.ReferralId === referralId) deleted.referral = true;
        },
      },
      candidate: {
        delete: async () => {
          deleted.candidate = true;
        },
      },
    };
    return fn(tx);
  };

  try {
    const result = await deleteCandidate(referralId, employeeId);

    assert.ok(deleted.application);
    assert.ok(deleted.referral);
    assert.equal(deleted.candidate, false);
    assert.equal(
      result.message,
      "Application and referral deleted successfully. Candidate has other applications.",
    );
    assert.equal(result.deletedCandidate, false);
  } finally {
    prisma.$transaction = originalTx;
  }
});

test("deleteCandidate also removes candidate when this is their only application", async () => {
  const referralId = 700;
  const employeeId = 40;

  const candidate = {
    CandidateId: 8,
    CVUrl: null,
    Application: [
      {
        ReferralId: referralId,
        Referral: { Status: "Pending" },
      },
    ],
  };

  const application = {
    ReferralId: referralId,
    EmployeeId: employeeId,
    Referral: { Status: "Pending" },
    Candidate: candidate,
  };

  const originalTx = prisma.$transaction;

  const deleted = {
    application: false,
    referral: false,
    candidate: false,
  };

  prisma.$transaction = async (fn) => {
    const tx = {
      application: {
        findFirst: async () => application,
        delete: async ({ where }) => {
          if (where.ReferralId === referralId) deleted.application = true;
        },
      },
      referral: {
        delete: async ({ where }) => {
          if (where.ReferralId === referralId) deleted.referral = true;
        },
      },
      candidate: {
        delete: async ({ where }) => {
          if (where.CandidateId === candidate.CandidateId)
            deleted.candidate = true;
        },
      },
    };
    return fn(tx);
  };

  try {
    const result = await deleteCandidate(referralId, employeeId);

    assert.ok(deleted.application);
    assert.ok(deleted.referral);
    assert.ok(deleted.candidate);
    assert.equal(result.message, "Candidate deleted successfully");
    assert.equal(result.deletedCandidate, true);
  } finally {
    prisma.$transaction = originalTx;
  }
});

test("getEmployeeReferrals returns paginated applications for employee", async () => {
  const params = {
    employeeId: 50,
    page: 2,
    pageSize: 5,
    search: "john",
    status: "Confirmed",
    createdAt: "2030-01-01",
  };

  const fakeApplications = [
    { ApplicationId: 1 },
    { ApplicationId: 2 },
  ];

  const originalCount = prisma.application.count;
  const originalFindMany = prisma.application.findMany;

  prisma.application.count = async () => 2;
  prisma.application.findMany = async () => fakeApplications;

  try {
    const result = await getEmployeeReferrals(params);

    assert.equal(result.page, 2);
    assert.equal(result.pageSize, 5);
    assert.equal(result.totalReferrals, 2);
    assert.equal(result.totalPages, Math.ceil(2 / 5));
    assert.equal(result.applications.length, 2);
  } finally {
    prisma.application.count = originalCount;
    prisma.application.findMany = originalFindMany;
  }
});

test("editCandidate updates candidate fields when only pending referrals exist", async () => {
  const payload = {
    candidateId: 9,
    employeeId: 60,
    candidateFirstName: "Updated",
    candidateLastName: "",
    candidateEmail: "",
    candidatePhoneNumber: "+11234567890",
    candidateYearOfExperience: 10,
    cvFile: null,
  };

  const candidate = {
    CandidateId: 9,
    FirstName: "Old",
    LastName: "Name",
    Email: "old@example.com",
    PhoneNumber: "+19876543210",
    Application: [
      {
        ReferralId: 800,
        EmployeeId: 60,
        Referral: { Status: "Pending" },
        Position: {},
        Employee: {},
      },
    ],
  };

  const originalFindUnique = prisma.candidate.findUnique;
  const originalTx = prisma.$transaction;

  let updateArgs;

  prisma.candidate.findUnique = async () => candidate;

  prisma.$transaction = async (fn) => {
    const tx = {
      candidate: {
        findUnique: async () => null, // Email uniqueness check - no existing candidate with new email
        update: async (args) => {
          updateArgs = args;
          return { ...candidate, ...args.data };
        },
      },
    };
    return fn(tx);
  };

  try {
    const result = await editCandidate(payload);

    assert.equal(updateArgs.where.CandidateId, payload.candidateId);
    assert.equal(updateArgs.data.FirstName, "Updated");
    assert.equal(updateArgs.data.PhoneNumber, "+11234567890");
    assert.equal(updateArgs.data.YearOfExperience, 10);
    assert.equal(result.updatedCandidate.CandidateId, 9);
    assert.equal(result.updatedCandidate.FirstName, "Updated");
    assert.equal(result.updatedCandidate.PhoneNumber, "+11234567890");
  } finally {
    prisma.candidate.findUnique = originalFindUnique;
    prisma.$transaction = originalTx;
  }
});

test("getEmployeeReferralDetails returns application for employee and referral", async () => {
  const params = {
    employeeId: 70,
    referralId: 900,
  };

  const fakeApplication = {
    ApplicationId: 300,
    ReferralId: 900,
    EmployeeId: 70,
  };

  const originalFindFirst = prisma.application.findFirst;

  prisma.application.findFirst = async () => fakeApplication;

  try {
    const result = await getEmployeeReferralDetails(params);

    assert.equal(result.ApplicationId, 300);
    assert.equal(result.ReferralId, 900);
    assert.equal(result.EmployeeId, 70);
  } finally {
    prisma.application.findFirst = originalFindFirst;
  }
});

