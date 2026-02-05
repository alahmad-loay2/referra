import test from "node:test";
import assert from "node:assert/strict";

import { getHrTeam } from "../../services/hr/hrTeam.service.js";
import { prisma } from "../../lib/prisma.js";

test("getHrTeam returns paginated HR members with departments and stats (happy path)", async () => {
  const query = {
    page: "1",
    limit: "10",
    search: "john",
    departmentId: 2,
  };

  const fakeHrMembers = [
    {
      HrId: 1,
      User: {
        UserId: 100,
        FirstName: "John",
        LastName: "Doe",
        Email: "john.doe@example.com",
      },
      Departments: [
        { Department: { DepartmentId: 2, Name: "Engineering" } },
        { Department: { DepartmentId: 3, Name: "Sales" } },
      ],
    },
  ];

  const originalHrCount = prisma.hr?.count;
  const originalDeptCount = prisma.department?.count;
  const originalHrFindMany = prisma.hr?.findMany;

  prisma.hr.count = async () => 1;
  prisma.department.count = async () => 5;
  prisma.hr.findMany = async (args) => {
    // basic sanity: where clause should respect search/department filters
    assert.ok(args.where);
    return fakeHrMembers;
  };

  try {
    const result = await getHrTeam(query);

    assert.equal(result.page, 1);
    assert.equal(result.pageSize, 10);
    assert.equal(result.total, 1);
    assert.equal(result.totalPages, 1);

    assert.equal(result.hrMembers.length, 1);
    assert.equal(result.hrMembers[0].HrId, 1);
    assert.equal(result.hrMembers[0].departments.length, 2);
    assert.equal(result.hrMembers[0].departments[0].Name, "Engineering");

    assert.equal(result.stats.totalMembers, 1);
    assert.equal(result.stats.totalDepartments, 5);
  } finally {
    prisma.hr.count = originalHrCount;
    prisma.department.count = originalDeptCount;
    prisma.hr.findMany = originalHrFindMany;
  }
});

