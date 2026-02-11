import test from "node:test";
import assert from "node:assert/strict";

import {
  createPosition,
  updatePositionState,
  updatePositionDetails,
  getHrPositions,
  getHrPositionDetails,
  getDepartmentsByHr,
} from "../../services/hr/hrPositions.service.js";
import { prisma } from "../../lib/prisma.js";

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

  const originalFindMany = prisma.hrDepartment.findMany;

  prisma.hrDepartment.findMany = async () => fakeHrDepartments;

  try {
    const result = await getDepartmentsByHr(hrId);

    assert.equal(result.length, 2);
    assert.equal(result[0].Name, "Engineering");
    assert.equal(result[1].Name, "Sales");
  } finally {
    prisma.hrDepartment.findMany = originalFindMany;
  }
});

