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

test("GET /api/hr/team returns paginated HR team members", async () => {
  const response = await request(app)
    .get("/api/hr/team")
    .set("x-test-user-id", hrTestData.testHrUser.UserId)
    .set("x-test-user-email", hrTestData.testHrUser.Email)
    .set("x-test-user-role", "HR")
    .set("x-test-hr-id", hrTestData.testHr.HrId)
    .set("x-test-hr-is-admin", "false")
    .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments))
    .query({ page: "1", limit: "10" });

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.hrMembers));
  assert.equal(typeof response.body.page, "number");
  assert.equal(typeof response.body.pageSize, "number");
  assert.equal(typeof response.body.total, "number");
  assert.equal(typeof response.body.totalPages, "number");
  assert.ok(response.body.stats);
  assert.equal(typeof response.body.stats.totalMembers, "number");
  assert.equal(typeof response.body.stats.totalDepartments, "number");
});

test("GET /api/hr/team with search filters results", async () => {
  const response = await request(app)
    .get("/api/hr/team")
    .set("x-test-user-id", hrTestData.testHrUser.UserId)
    .set("x-test-user-email", hrTestData.testHrUser.Email)
    .set("x-test-user-role", "HR")
    .set("x-test-hr-id", hrTestData.testHr.HrId)
    .set("x-test-hr-is-admin", "false")
    .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments))
    .query({ page: "1", limit: "10", search: "Test" });

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.hrMembers));
});

test("GET /api/hr/team with department filter", async () => {
  const response = await request(app)
    .get("/api/hr/team")
    .set("x-test-user-id", hrTestData.testHrUser.UserId)
    .set("x-test-user-email", hrTestData.testHrUser.Email)
    .set("x-test-user-role", "HR")
    .set("x-test-hr-id", hrTestData.testHr.HrId)
    .set("x-test-hr-is-admin", "false")
    .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments))
    .query({ page: "1", limit: "10", departmentId: hrTestData.testDepartment1.DepartmentId });

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.hrMembers));
});
