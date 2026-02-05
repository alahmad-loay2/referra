import test from "node:test";
import assert from "node:assert/strict";

import {
  getVisiblePositions,
  getPositionDetails,
} from "../../services/employee/employeePositions.service.js";
import { prisma } from "../../lib/prisma.js";

test("getVisiblePositions returns paginated open positions for employee", async () => {
  const user = { Role: "Employee" };

  const query = {
    page: "1",
    limit: "10",
  };

  const fakePositions = [
    {
      PositionId: 1,
      PositionState: "OPEN",
      Deadline: new Date(Date.now() + 86400000),
      Department: { DepartmentId: 2, Name: "Engineering" },
    },
  ];

  const originalCount = prisma.position.count;
  const originalFindMany = prisma.position.findMany;

  prisma.position.count = async () => 1;
  prisma.position.findMany = async () => fakePositions;

  try {
    const result = await getVisiblePositions(user, query);

    assert.equal(result.page, 1);
    assert.equal(result.limit, 10);
    assert.equal(result.total, 1);
    assert.equal(result.totalPages, 1);
    assert.equal(result.hasNextPage, false);
    assert.equal(result.hasPrevPage, false);
    assert.equal(result.positions.length, 1);
    assert.equal(result.positions[0].PositionId, 1);
  } finally {
    prisma.position.count = originalCount;
    prisma.position.findMany = originalFindMany;
  }
});

test("getPositionDetails returns open, non-expired position for employee", async () => {
  const user = { Role: "Employee" };
  const positionId = 10;

  const futureDeadline = new Date(Date.now() + 86400000);

  const fakePosition = {
    PositionId: positionId,
    PositionState: "OPEN",
    Deadline: futureDeadline,
    Department: { DepartmentId: 3, Name: "Sales" },
  };

  const originalFindUnique = prisma.position.findUnique;

  prisma.position.findUnique = async () => fakePosition;

  try {
    const result = await getPositionDetails(user, positionId);

    assert.equal(result.PositionId, positionId);
    assert.equal(result.PositionState, "OPEN");
    assert.equal(result.Deadline, futureDeadline);
  } finally {
    prisma.position.findUnique = originalFindUnique;
  }
});

