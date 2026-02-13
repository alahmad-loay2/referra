import test from "node:test";
import assert from "node:assert/strict";

import {
  createPosition,
  updatePositionState,
  updatePositionDetails,
  getHrPositions,
  getHrPositionDetails,
  getDepartmentsByHr,
  deletePosition,
} from "../../../services/hr/hrPositions.service.js";
import { prisma } from "../../../lib/prisma.js";

test("createPosition creates a position successfully", async () => {
  const payload = {
    positionTitle: "Software Engineer test",
    companyName: "Acme Corp",
    yearsRequired: 3,
    description: "Build and maintain awesome features",
    timeZone: "UTC",
    deadline: "2030-12-31T00:00:00.000Z",
    positionLocation: "Remote",
    departmentId: 10,
    employmentType: "full_time",
  };

  const hr = {
    Departments: [{ DepartmentId: 10 }],
  };

  const fakePosition = {
    PositionId: 123,
    ...payload,
  };

  let receivedArgs;
  const originalCreate = prisma.position.create;

  prisma.position.create = async (args) => {
    receivedArgs = args;
    return fakePosition;
  };

  try {
    const result = await createPosition(payload, hr);

    // Returns whatever Prisma returns
    assert.equal(result, fakePosition);

    // Ensures data is mapped and normalized correctly
    assert.deepEqual(receivedArgs.data.PositionTitle, payload.positionTitle);
    assert.deepEqual(receivedArgs.data.CompanyName, payload.companyName);
    assert.deepEqual(receivedArgs.data.YearsRequired, Number(payload.yearsRequired));
    assert.deepEqual(receivedArgs.data.Description, payload.description);
    assert.deepEqual(receivedArgs.data.Timezone, payload.timeZone);
    assert.equal(
      receivedArgs.data.Deadline.toISOString(),
      new Date(payload.deadline).toISOString(),
    );
    assert.deepEqual(receivedArgs.data.PositionLocation, payload.positionLocation);
    assert.deepEqual(receivedArgs.data.DepartmentId, payload.departmentId);
    assert.deepEqual(receivedArgs.data.PositionState, "OPEN");
    assert.deepEqual(receivedArgs.data.EmploymentType, "FULL_TIME");
  } finally {
    prisma.position.create = originalCreate;
  }
});

test("updatePositionState closes and opens a position correctly", async () => {
  const positionId = 42;

  const hrUser = {
    Departments: [{ DepartmentId: 5 }],
  };

  const existingPosition = {
    PositionId: positionId,
    DepartmentId: 5,
    PositionState: "OPEN",
    Deadline: new Date("2030-01-01T00:00:00.000Z"),
  };

  const applications = [
    {
      ReferralId: "ref1",
      Referral: {
        ReferralId: "ref1",
        Status: "Pending",
        AcceptedInOtherPosition: false,
        Prospect: false,
      },
    },
    {
      ReferralId: "ref2",
      Referral: {
        ReferralId: "ref2",
        Status: "Confirmed",
        AcceptedInOtherPosition: false,
        Prospect: false,
      },
    },
    {
      ReferralId: "ref3",
      Referral: {
        ReferralId: "ref3",
        Status: "Hired",
        AcceptedInOtherPosition: false,
        Prospect: false,
      },
    },
    {
      ReferralId: "ref4",
      Referral: {
        ReferralId: "ref4",
        Status: "Pending",
        AcceptedInOtherPosition: true,
        Prospect: false,
      },
    },
  ];

  let findFirstArgs;
  let updateArgs;
  let findManyArgs;
  let referralUpdateArgs = [];

  const originalTransaction = prisma.$transaction;

  prisma.$transaction = async (fn) => {
    const tx = {
      position: {
        findFirst: async (args) => {
          findFirstArgs = args;
          return existingPosition;
        },
        update: async (args) => {
          updateArgs = args;
          return { ...existingPosition, ...args.data };
        },
      },
      application: {
        findMany: async (args) => {
          findManyArgs = args;
          return applications;
        },
      },
      referral: {
        update: async (args) => {
          referralUpdateArgs.push(args);
          const referral = applications.find(
            (app) => app.Referral.ReferralId === args.where.ReferralId,
          )?.Referral;
          return { ...referral, ...args.data };
        },
      },
    };
    return fn(tx);
  };

  try {
    // Test closing position
    const result = await updatePositionState(positionId, "closed", hrUser);

    assert.equal(result.PositionState, "CLOSED");
    assert.deepEqual(findFirstArgs.where.PositionId, positionId);
    assert.deepEqual(
      findFirstArgs.where.DepartmentId.in,
      hrUser.Departments.map((d) => d.DepartmentId),
    );
    assert.deepEqual(updateArgs.where.PositionId, positionId);
    assert.equal(updateArgs.data.PositionState, "CLOSED");
    assert.deepEqual(findManyArgs.where.PositionId, positionId);
    // Should mark ref1 and ref2 as prospects (not Hired, not AcceptedInOtherPosition)
    // ref3 is Hired, so should not be marked
    // ref4 is AcceptedInOtherPosition, so should not be marked
    assert.equal(referralUpdateArgs.length, 2);
    assert.equal(referralUpdateArgs[0].where.ReferralId, "ref1");
    assert.equal(referralUpdateArgs[0].data.Prospect, true);
    assert.equal(referralUpdateArgs[1].where.ReferralId, "ref2");
    assert.equal(referralUpdateArgs[1].data.Prospect, true);

    // Reset for opening test
    referralUpdateArgs = [];
    existingPosition.PositionState = "CLOSED";
    applications[0].Referral.Prospect = true;
    applications[1].Referral.Prospect = true;

    // Test opening position
    const openResult = await updatePositionState(positionId, "open", hrUser);

    assert.equal(openResult.PositionState, "OPEN");
    // Should unmark ref1 and ref2 as prospects
    assert.equal(referralUpdateArgs.length, 2);
    assert.equal(referralUpdateArgs[0].where.ReferralId, "ref1");
    assert.equal(referralUpdateArgs[0].data.Prospect, false);
    assert.equal(referralUpdateArgs[1].where.ReferralId, "ref2");
    assert.equal(referralUpdateArgs[1].data.Prospect, false);
    // Should extend deadline by 10 days
    const expectedDeadline = new Date();
    expectedDeadline.setDate(expectedDeadline.getDate() + 10);
    const deadlineDiff = Math.abs(
      openResult.Deadline.getTime() - expectedDeadline.getTime(),
    );
    assert.ok(deadlineDiff < 60000); // Within 1 minute tolerance
  } finally {
    prisma.$transaction = originalTransaction;
  }
});

test("updatePositionDetails updates fields when HR owns the position", async () => {
  const positionId = 99;

  const hr = {
    Departments: [{ DepartmentId: 7 }],
  };

  const existingPosition = {
    PositionId: positionId,
    DepartmentId: 7,
  };

  const payload = {
    positionTitle: "Updated Title",
    companyName: "Updated Company",
    yearsRequired: 5,
    description: "Updated description",
    timeZone: "CET",
    deadline: "2031-01-01T00:00:00.000Z",
    positionLocation: "On-site",
    departmentId: 7,
    employmentType: "part_time",
  };

  let findFirstArgs;
  let updateArgs;

  const originalTransaction = prisma.$transaction;

  prisma.$transaction = async (fn) => {
    const tx = {
      position: {
        findFirst: async (args) => {
          findFirstArgs = args;
          return existingPosition;
        },
        update: async (args) => {
          updateArgs = args;
          return { ...existingPosition, ...args.data };
        },
      },
    };
    return fn(tx);
  };

  try {
    const result = await updatePositionDetails(positionId, payload, hr);

    assert.equal(result.PositionTitle, payload.positionTitle);
    assert.equal(result.CompanyName, payload.companyName);
    assert.equal(result.YearsRequired, Number(payload.yearsRequired));
    assert.equal(result.Description, payload.description);
    assert.equal(result.Timezone, payload.timeZone);
    assert.equal(
      result.Deadline.toISOString(),
      new Date(payload.deadline).toISOString(),
    );
    assert.equal(result.PositionLocation, payload.positionLocation);
    assert.equal(result.DepartmentId, payload.departmentId);
    assert.equal(result.EmploymentType, payload.employmentType.toUpperCase());

    assert.deepEqual(findFirstArgs.where.PositionId, positionId);
    assert.deepEqual(
      findFirstArgs.where.DepartmentId.in,
      hr.Departments.map((d) => d.DepartmentId),
    );
  } finally {
    prisma.$transaction = originalTransaction;
  }
});

test("updatePositionDetails throws when assigning to not-owned department", async () => {
  const positionId = 100;

  const hr = {
    Departments: [{ DepartmentId: 1 }],
  };

  const existingPosition = {
    PositionId: positionId,
    DepartmentId: 1,
  };

  const payload = {
    departmentId: 2, // HR does not own this department
  };

  const originalTransaction = prisma.$transaction;

  prisma.$transaction = async (fn) => {
    const tx = {
      position: {
        findFirst: async () => existingPosition,
        update: async () => {
          throw new Error("Should not be called");
        },
      },
    };
    return fn(tx);
  };

  try {
    await assert.rejects(
      () => updatePositionDetails(positionId, payload, hr),
      (err) => {
        assert.equal(err.message, "Cannot assign position to this department");
        assert.equal(err.statusCode, 403);
        return true;
      },
    );
  } finally {
    prisma.$transaction = originalTransaction;
  }
});

test("getHrPositions returns formatted positions and stats", async () => {
  const hr = {
    Departments: [{ DepartmentId: 1 }, { DepartmentId: 2 }],
  };

  const query = {
    page: "1",
    limit: "10",
  };

  const fakePositions = [
    { PositionId: 1, DepartmentId: 1, PositionTitle: "Dev", Department: {} },
    { PositionId: 2, DepartmentId: 2, PositionTitle: "QA", Department: {} },
  ];

  const fakeApplicantsCounts = [
    { PositionId: 1, _count: 3 },
    { PositionId: 2, _count: 5 },
  ];

  const originalCount = prisma.position.count;
  const originalFindMany = prisma.position.findMany;
  const originalAppCount = prisma.application?.count;
  const originalGroupBy = prisma.application?.groupBy;

  prisma.position.count = async () => 2;
  prisma.position.findMany = async () => fakePositions;

  prisma.application.count = async () => 8;
  prisma.application.groupBy = async () => fakeApplicantsCounts;

  try {
    const result = await getHrPositions(hr, query);

    assert.equal(result.total, 2);
    assert.equal(result.page, 1);
    assert.equal(result.limit, 10);
    assert.equal(result.positions.length, 2);
    assert.equal(result.positions[0].applicantsCount, 3);
    assert.equal(result.positions[1].applicantsCount, 5);
    assert.equal(result.stats.totalPositions, 2);
    assert.equal(result.stats.openPositions, 2);
    assert.equal(result.stats.totalApplicants, 8);
  } finally {
    prisma.position.count = originalCount;
    prisma.position.findMany = originalFindMany;
    prisma.application.count = originalAppCount;
    prisma.application.groupBy = originalGroupBy;
  }
});

test("getHrPositionDetails returns position with applicantsCount", async () => {
  const hr = {
    Departments: [{ DepartmentId: 1 }],
  };

  const positionId = 10;

  const fakePosition = {
    PositionId: positionId,
    DepartmentId: 1,
    PositionTitle: "Dev",
  };

  const originalFindFirst = prisma.position.findFirst;
  const originalAppCount = prisma.application?.count;

  prisma.position.findFirst = async () => fakePosition;
  prisma.application.count = async () => 4;

  try {
    const result = await getHrPositionDetails(hr, positionId);

    assert.equal(result.PositionId, positionId);
    assert.equal(result.applicantsCount, 4);
  } finally {
    prisma.position.findFirst = originalFindFirst;
    prisma.application.count = originalAppCount;
  }
});

test("getDepartmentsByHr returns mapped departments", async () => {
  const hrId = 7;

  const fakeHrDepartments = [
    { Department: { DepartmentId: 1, Name: "Engineering" } },
    { Department: { DepartmentId: 2, Name: "Sales" } },
  ];

  const originalHrFindUnique = prisma.hr.findUnique;
  const originalHrDeptFindMany = prisma.hrDepartment.findMany;

  // Mock prisma.hr.findUnique to return a non-admin HR (so it uses hrDepartment.findMany path)
  prisma.hr.findUnique = async () => ({ isAdmin: false });

  // Mock prisma.hrDepartment.findMany for non-admin path
  prisma.hrDepartment.findMany = async () => fakeHrDepartments;

  try {
    const result = await getDepartmentsByHr(hrId);

    assert.equal(result.length, 2);
    assert.equal(result[0].Name, "Engineering");
    assert.equal(result[1].Name, "Sales");
  } finally {
    if (originalHrFindUnique) {
      prisma.hr.findUnique = originalHrFindUnique;
    } else {
      delete prisma.hr.findUnique;
    }
    if (originalHrDeptFindMany) {
      prisma.hrDepartment.findMany = originalHrDeptFindMany;
    } else {
      delete prisma.hrDepartment.findMany;
    }
  }
});

test("deletePosition deletes position with applications, referrals, and candidates with no other applications", async () => {
  const positionId = "pos-123";
  const hrUser = {
    Departments: [{ DepartmentId: "dept-1" }],
  };

  const position = {
    PositionId: positionId,
    DepartmentId: "dept-1",
  };

  const applications = [
    {
      ReferralId: "ref-1",
      CandidateId: "cand-1",
      PositionId: positionId,
      Referral: {
        ReferralId: "ref-1",
        Status: "Pending",
      },
      Candidate: {
        CandidateId: "cand-1",
        Application: [
          {
            PositionId: positionId,
            ReferralId: "ref-1",
            Referral: { ReferralId: "ref-1", Status: "Pending" },
          },
        ],
      },
    },
    {
      ReferralId: "ref-2",
      CandidateId: "cand-2",
      PositionId: positionId,
      Referral: {
        ReferralId: "ref-2",
        Status: "Confirmed",
      },
      Candidate: {
        CandidateId: "cand-2",
        Application: [
          {
            PositionId: positionId,
            ReferralId: "ref-2",
            Referral: { ReferralId: "ref-2", Status: "Confirmed" },
          },
        ],
      },
    },
  ];

  let findFirstArgs;
  let findManyArgs;
  let referralDeleteArgs = [];
  let applicationDeleteManyArgs;
  let candidateDeleteManyArgs;
  let positionDeleteArgs;

  const originalTransaction = prisma.$transaction;

  prisma.$transaction = async (fn) => {
    const tx = {
      position: {
        findFirst: async (args) => {
          findFirstArgs = args;
          return position;
        },
        delete: async (args) => {
          positionDeleteArgs = args;
          return position;
        },
      },
      application: {
        findMany: async (args) => {
          findManyArgs = args;
          return applications;
        },
        deleteMany: async (args) => {
          applicationDeleteManyArgs = args;
          return { count: applications.length };
        },
      },
      referral: {
        delete: async (args) => {
          referralDeleteArgs.push(args);
          return { ReferralId: args.where.ReferralId };
        },
      },
      candidate: {
        deleteMany: async (args) => {
          candidateDeleteManyArgs = args;
          return { count: 2 };
        },
      },
    };
    return fn(tx);
  };

  try {
    const result = await deletePosition(positionId, hrUser);

    assert.equal(result.success, true);
    assert.equal(result.deletedReferrals, 2);
    assert.equal(result.deletedCandidates, 2);

    // Verify position ownership check
    assert.deepEqual(findFirstArgs.where.PositionId, positionId);
    assert.deepEqual(
      findFirstArgs.where.DepartmentId.in,
      hrUser.Departments.map((d) => d.DepartmentId),
    );

    // Verify applications were fetched
    assert.deepEqual(findManyArgs.where.PositionId, positionId);

    // Verify referrals were deleted
    assert.equal(referralDeleteArgs.length, 2);
    assert.equal(referralDeleteArgs[0].where.ReferralId, "ref-1");
    assert.equal(referralDeleteArgs[1].where.ReferralId, "ref-2");

    // Verify applications were deleted
    assert.deepEqual(applicationDeleteManyArgs.where.PositionId, positionId);

    // Verify candidates were deleted (both have no other applications)
    assert.deepEqual(candidateDeleteManyArgs.where.CandidateId.in, [
      "cand-1",
      "cand-2",
    ]);

    // Verify position was deleted
    assert.deepEqual(positionDeleteArgs.where.PositionId, positionId);
  } finally {
    prisma.$transaction = originalTransaction;
  }
});

test("deletePosition does not delete candidates with other applications", async () => {
  const positionId = "pos-123";
  const hrUser = {
    Departments: [{ DepartmentId: "dept-1" }],
  };

  const position = {
    PositionId: positionId,
    DepartmentId: "dept-1",
  };

  const applications = [
    {
      ReferralId: "ref-1",
      CandidateId: "cand-1",
      PositionId: positionId,
      Referral: {
        ReferralId: "ref-1",
        Status: "Pending",
      },
      Candidate: {
        CandidateId: "cand-1",
        Application: [
          {
            PositionId: positionId,
            ReferralId: "ref-1",
            Referral: { ReferralId: "ref-1", Status: "Pending" },
          },
          {
            PositionId: "pos-other",
            ReferralId: "ref-other",
            Referral: { ReferralId: "ref-other", Status: "Confirmed" },
          },
        ],
      },
    },
  ];

  let candidateDeleteManyCalled = false;

  const originalTransaction = prisma.$transaction;

  prisma.$transaction = async (fn) => {
    const tx = {
      position: {
        findFirst: async () => position,
        delete: async () => position,
      },
      application: {
        findMany: async () => applications,
        deleteMany: async () => ({ count: 1 }),
      },
      referral: {
        delete: async () => ({}),
      },
      candidate: {
        deleteMany: async () => {
          candidateDeleteManyCalled = true;
          return { count: 0 };
        },
      },
    };
    return fn(tx);
  };

  try {
    const result = await deletePosition(positionId, hrUser);

    assert.equal(result.success, true);
    assert.equal(result.deletedReferrals, 1);
    assert.equal(result.deletedCandidates, 0);

    // Verify candidate was NOT deleted (has other application)
    assert.equal(candidateDeleteManyCalled, false);
  } finally {
    prisma.$transaction = originalTransaction;
  }
});

test("deletePosition throws error when position not found", async () => {
  const positionId = "pos-123";
  const hrUser = {
    Departments: [{ DepartmentId: "dept-1" }],
  };

  const originalTransaction = prisma.$transaction;

  prisma.$transaction = async (fn) => {
    const tx = {
      position: {
        findFirst: async () => null,
      },
    };
    return fn(tx);
  };

  try {
    await assert.rejects(
      () => deletePosition(positionId, hrUser),
      (err) => {
        assert.equal(err.message, "Position not found or access denied");
        assert.equal(err.statusCode, 403);
        return true;
      },
    );
  } finally {
    prisma.$transaction = originalTransaction;
  }
});

test("deletePosition throws error when HR does not have access to position", async () => {
  const positionId = "pos-123";
  const hrUser = {
    Departments: [{ DepartmentId: "dept-1" }],
  };

  const originalTransaction = prisma.$transaction;

  prisma.$transaction = async (fn) => {
    const tx = {
      position: {
        findFirst: async () => null, // Position in different department
      },
    };
    return fn(tx);
  };

  try {
    await assert.rejects(
      () => deletePosition(positionId, hrUser),
      (err) => {
        assert.equal(err.message, "Position not found or access denied");
        assert.equal(err.statusCode, 403);
        return true;
      },
    );
  } finally {
    prisma.$transaction = originalTransaction;
  }
});

test("deletePosition throws error when positionId is missing", async () => {
  const hrUser = {
    Departments: [{ DepartmentId: "dept-1" }],
  };

  await assert.rejects(
    () => deletePosition(null, hrUser),
    (err) => {
      assert.equal(err.message, "PositionId is required");
      assert.equal(err.statusCode, 400);
      return true;
    },
  );
});

test("deletePosition throws error when HR has no departments", async () => {
  const positionId = "pos-123";
  const hrUser = {
    Departments: [],
  };

  await assert.rejects(
    () => deletePosition(positionId, hrUser),
    (err) => {
      assert.equal(err.message, "HR has no assigned departments");
      assert.equal(err.statusCode, 403);
      return true;
    },
  );
});

test("deletePosition handles position with no applications", async () => {
  const positionId = "pos-123";
  const hrUser = {
    Departments: [{ DepartmentId: "dept-1" }],
  };

  const position = {
    PositionId: positionId,
    DepartmentId: "dept-1",
  };

  let candidateDeleteManyCalled = false;

  const originalTransaction = prisma.$transaction;

  prisma.$transaction = async (fn) => {
    const tx = {
      position: {
        findFirst: async () => position,
        delete: async () => position,
      },
      application: {
        findMany: async () => [],
        deleteMany: async () => ({ count: 0 }),
      },
      referral: {
        delete: async () => ({}),
      },
      candidate: {
        deleteMany: async () => {
          candidateDeleteManyCalled = true;
          return { count: 0 };
        },
      },
    };
    return fn(tx);
  };

  try {
    const result = await deletePosition(positionId, hrUser);

    assert.equal(result.success, true);
    assert.equal(result.deletedReferrals, 0);
    assert.equal(result.deletedCandidates, 0);
    assert.equal(candidateDeleteManyCalled, false);
  } finally {
    prisma.$transaction = originalTransaction;
  }
});
