import test from "node:test";
import assert from "node:assert/strict";

import { createDepartment } from "../../services/hr/hrAdmin.service.js";
import { prisma } from "../../lib/prisma.js";

test("createDepartment creates a new department successfully", async () => {
  const departmentName = "Engineering";

  const fakeDepartment = {
    DepartmentId: 1,
    DepartmentName: departmentName,
  };

  const originalTransaction = prisma.$transaction;

  prisma.$transaction = async (fn) => {
    const tx = {
      department: {
        findUnique: async () => null, // Department doesn't exist
        create: async ({ data }) => {
          return { DepartmentId: 1, ...data };
        },
      },
    };
    return fn(tx);
  };

  try {
    const result = await createDepartment(departmentName);

    assert.equal(result.DepartmentName, departmentName);
    assert.equal(result.DepartmentId, 1);
  } finally {
    prisma.$transaction = originalTransaction;
  }
});

test("createDepartment fails when department already exists", async () => {
  const departmentName = "Engineering";

  const existingDepartment = {
    DepartmentId: 1,
    DepartmentName: departmentName,
  };

  const originalTransaction = prisma.$transaction;

  prisma.$transaction = async (fn) => {
    const tx = {
      department: {
        findUnique: async () => existingDepartment, // Department exists
        create: async () => {
          throw new Error("Should not be called");
        },
      },
    };
    return fn(tx);
  };

  try {
    await assert.rejects(
      () => createDepartment(departmentName),
      (err) => {
        assert.equal(err.message, "Department with this name already exists");
        assert.equal(err.statusCode, 400);
        return true;
      },
    );
  } finally {
    prisma.$transaction = originalTransaction;
  }
});
