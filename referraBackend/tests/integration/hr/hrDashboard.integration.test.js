import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createTestApp } from "../helpers/testApp.js";
import { createHrTestData, cleanupHrTestData } from "../helpers/testHrData.js";
import { createTestData, cleanupTestData } from "../helpers/testData.js";
import { prisma } from "../../../lib/prisma.js";

const app = createTestApp();
let hrTestData;
let testData;

// Setup: Create test data before all tests
test.before(async () => {
  try {
    hrTestData = await createHrTestData();
    testData = await createTestData();
  } catch (error) {
    console.error("Failed to create test data:", error);
    hrTestData = null;
    testData = null;
    throw error;
  }
});

// Cleanup: Remove test data after all tests
test.after(async () => {
  try {
    await cleanupHrTestData(hrTestData);
    await cleanupTestData(testData);
  } catch (error) {
    console.error("Failed to cleanup test data:", error);
  } finally {
    // Don't disconnect - tests share the same Prisma instance
  }
});

test("GET /api/hr/dashboard returns HR dashboard stats", async () => {
  const response = await request(app)
    .get("/api/hr/dashboard")
    .set("x-test-user-id", hrTestData.testHrUser.UserId)
    .set("x-test-user-email", hrTestData.testHrUser.Email)
    .set("x-test-user-role", "HR")
    .set("x-test-hr-id", hrTestData.testHr.HrId)
    .set("x-test-hr-is-admin", "false")
    .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments));

  assert.equal(response.status, 200);
  assert.equal(typeof response.body.totalReferrals, "number");
  assert.equal(typeof response.body.openPositions, "number");
  assert.equal(typeof response.body.pendingReviews, "number");
  assert.equal(typeof response.body.successfulHires, "number");
  assert.ok(Array.isArray(response.body.recentReferrals));
});
