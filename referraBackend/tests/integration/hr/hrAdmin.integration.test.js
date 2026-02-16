import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createTestApp } from "../helpers/testApp.js";
import { createHrTestData, cleanupHrTestData } from "../helpers/testHrData.js";
import { prisma } from "../../../lib/prisma.js";

const app = createTestApp();
let hrTestData;
const createdDepartmentIds = []; // Track departments created during tests

// Setup: Create test data before all tests
test.before(async () => {
  try {
    // Cleanup any orphaned test departments from previous failed runs
    const orphanedDepartments = await prisma.department.findMany({
      where: {
        DepartmentName: { startsWith: "New Department " },
      },
      include: {
        Positions: true,
        Hrs: true,
      },
    });

    for (const dept of orphanedDepartments) {
      try {
        // Delete positions first
        if (dept.Positions.length > 0) {
          await prisma.position.deleteMany({
            where: { DepartmentId: dept.DepartmentId },
          });
        }
        // Delete HrDepartment links
        if (dept.Hrs.length > 0) {
          await prisma.hrDepartment.deleteMany({
            where: { DepartmentId: dept.DepartmentId },
          });
        }
        // Delete department
        await prisma.department.deleteMany({
          where: { DepartmentId: dept.DepartmentId },
        });
      } catch (error) {
        console.error(`Failed to cleanup orphaned department ${dept.DepartmentId}:`, error);
      }
    }

    hrTestData = await createHrTestData();
  } catch (error) {
    console.error("Failed to create test data:", error);
    hrTestData = null;
    throw error;
  }
});

// Cleanup: Remove test data after all tests
test.after(async () => {
  try {
    // Cleanup any departments created during tests
    for (const departmentId of createdDepartmentIds) {
      try {
        // Delete positions first (if any)
        await prisma.position.deleteMany({
          where: { DepartmentId: departmentId },
        });
        // Delete HrDepartment links
        await prisma.hrDepartment.deleteMany({
          where: { DepartmentId: departmentId },
        });
        // Delete department
        await prisma.department.deleteMany({
          where: { DepartmentId: departmentId },
        });
      } catch (error) {
        console.error(`Failed to cleanup department ${departmentId}:`, error);
      }
    }
    await cleanupHrTestData(hrTestData);
  } catch (error) {
    console.error("Failed to cleanup test data:", error);
  } finally {
    // Don't disconnect - tests share the same Prisma instance
  }
});

test("POST /api/hr/department creates a new department (admin only)", async () => {
  const response = await request(app)
    .post("/api/hr/department")
    .set("x-test-user-id", hrTestData.testAdminHrUser.UserId)
    .set("x-test-user-email", hrTestData.testAdminHrUser.Email)
    .set("x-test-user-role", "HR")
    .set("x-test-hr-id", hrTestData.testAdminHr.HrId)
    .set("x-test-hr-is-admin", "true")
    .set("x-test-hr-departments", JSON.stringify(hrTestData.adminHrWithDepts.Departments))
    .send({
      name: `New Department ${Date.now()}`,
    });

  assert.equal(response.status, 201);
  assert.ok(response.body.DepartmentId);
  assert.ok(response.body.DepartmentName);

  // Track for cleanup in after hook
  createdDepartmentIds.push(response.body.DepartmentId);
});

test("POST /api/hr/department returns 400 when department already exists", async () => {
  // Try to create a department with existing name
  const response = await request(app)
    .post("/api/hr/department")
    .set("x-test-user-id", hrTestData.testAdminHrUser.UserId)
    .set("x-test-user-email", hrTestData.testAdminHrUser.Email)
    .set("x-test-user-role", "HR")
    .set("x-test-hr-id", hrTestData.testAdminHr.HrId)
    .set("x-test-hr-is-admin", "true")
    .set("x-test-hr-departments", JSON.stringify(hrTestData.adminHrWithDepts.Departments))
    .send({
      name: hrTestData.testDepartment1.DepartmentName,
    });

  assert.equal(response.status, 400);
  assert.ok(response.body.message);
});

test("POST /api/hr/department returns 403 for non-admin HR", async () => {
  const response = await request(app)
    .post("/api/hr/department")
    .set("x-test-user-id", hrTestData.testHrUser.UserId)
    .set("x-test-user-email", hrTestData.testHrUser.Email)
    .set("x-test-user-role", "HR")
    .set("x-test-hr-id", hrTestData.testHr.HrId)
    .set("x-test-hr-is-admin", "false")
    .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments))
    .send({
      name: "Unauthorized Department",
    });

  assert.equal(response.status, 403);
  assert.ok(response.body.message);
});
