import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createTestApp } from "../helpers/testApp.js";
import { createHrTestData, cleanupHrTestData } from "../helpers/testHrData.js";
import { prisma } from "../../../lib/prisma.js";

const app = createTestApp();
let hrTestData;

// Setup: Create test data before all tests
test.before(async () => {
  try {
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

  // Cleanup - delete HrDepartment links first, then department
  await prisma.hrDepartment.deleteMany({
    where: { DepartmentId: response.body.DepartmentId },
  }).catch(() => {});
  await prisma.department.deleteMany({
    where: { DepartmentId: response.body.DepartmentId },
  }).catch(() => {});
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
