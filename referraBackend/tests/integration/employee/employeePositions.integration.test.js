import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { randomUUID } from "crypto";
import { createTestApp } from "../helpers/testApp.js";
import { createTestData, cleanupTestData } from "../helpers/testData.js";
import { prisma } from "../../../lib/prisma.js";

const app = createTestApp();
let testData;

// Setup: Create test data before all tests
test.before(async () => {
  try {
    testData = await createTestData();
  } catch (error) {
    console.error("Failed to create test data:", error);
    testData = null;
    throw error;
  }
});

// Cleanup: Remove test data after all tests
test.after(async () => {
  try {
    await cleanupTestData(testData);
  } catch (error) {
    console.error("Failed to cleanup test data:", error);
  } finally {
    // Don't disconnect - tests share the same Prisma instance
  }
});

test("GET /api/employee/positions-employee returns paginated open positions", async () => {
  const response = await request(app)
    .get("/api/employee/positions-employee")
    .set("x-test-user-id", testData.testUser.UserId)
    .set("x-test-user-email", testData.testUser.Email)
    .set("x-test-user-role", "Employee")
    .set("x-test-employee-id", testData.testEmployee.EmployeeId)
    .query({ page: "1", limit: "10" });

  assert.equal(response.status, 200);
  assert.ok(response.body.positions);
  assert.ok(Array.isArray(response.body.positions));
  assert.equal(typeof response.body.total, "number");
  assert.equal(typeof response.body.page, "number");
  assert.equal(typeof response.body.limit, "number");
  assert.equal(typeof response.body.totalPages, "number");
  assert.equal(typeof response.body.hasNextPage, "boolean");
  assert.equal(typeof response.body.hasPrevPage, "boolean");

  // Should return at least the open positions we created
  assert.ok(response.body.total >= 2); // testPosition1 and testPosition2

  // Verify positions are open and not expired
  response.body.positions.forEach((position) => {
    assert.equal(position.PositionState, "OPEN");
    assert.ok(new Date(position.Deadline) > new Date());
  });
});

test("GET /api/employee/positions-employee with pagination returns correct page", async () => {
  const response = await request(app)
    .get("/api/employee/positions-employee")
    .set("x-test-user-id", testData.testUser.UserId)
    .set("x-test-user-email", testData.testUser.Email)
    .set("x-test-user-role", "Employee")
    .set("x-test-employee-id", testData.testEmployee.EmployeeId)
    .query({ page: "1", limit: "1" });

  assert.equal(response.status, 200);
  assert.equal(response.body.page, 1);
  assert.equal(response.body.limit, 1);
  assert.ok(response.body.positions.length <= 1);
});

test("GET /api/employee/positions-employee/:positionId returns position details for open position", async () => {
  const response = await request(app)
    .get(`/api/employee/positions-employee/${testData.testPosition1.PositionId}`)
    .set("x-test-user-id", testData.testUser.UserId)
    .set("x-test-user-email", testData.testUser.Email)
    .set("x-test-user-role", "Employee")
    .set("x-test-employee-id", testData.testEmployee.EmployeeId);

  assert.equal(response.status, 200);
  assert.equal(response.body.PositionId, testData.testPosition1.PositionId);
  assert.equal(response.body.PositionTitle, testData.testPosition1.PositionTitle);
  assert.equal(response.body.CompanyName, testData.testPosition1.CompanyName);
  assert.equal(response.body.PositionState, "OPEN");
  assert.ok(response.body.Department);
  assert.equal(response.body.Department.DepartmentId, testData.testDepartment.DepartmentId);
});

test("GET /api/employee/positions-employee/:positionId returns 404 for closed position", async () => {
  const response = await request(app)
    .get(`/api/employee/positions-employee/${testData.testPositionClosed.PositionId}`)
    .set("x-test-user-id", testData.testUser.UserId)
    .set("x-test-user-email", testData.testUser.Email)
    .set("x-test-user-role", "Employee")
    .set("x-test-employee-id", testData.testEmployee.EmployeeId);

  assert.equal(response.status, 404);
  assert.ok(response.body.message);
});

test("GET /api/employee/positions-employee/:positionId returns 404 for non-existent position", async () => {
  // Use a valid UUID format for the test
  const nonExistentId = randomUUID();
  
  const response = await request(app)
    .get(`/api/employee/positions-employee/${nonExistentId}`)
    .set("x-test-user-id", testData.testUser.UserId)
    .set("x-test-user-email", testData.testUser.Email)
    .set("x-test-user-role", "Employee")
    .set("x-test-employee-id", testData.testEmployee.EmployeeId);

  assert.equal(response.status, 404);
  assert.ok(response.body.message);
});

test("GET /api/employee/positions-employee excludes expired positions", async () => {
  // Create an expired position
  const expiredDeadline = new Date();
  expiredDeadline.setDate(expiredDeadline.getDate() - 1);

  const expiredPosition = await prisma.position.create({
    data: {
      PositionTitle: "Expired Position",
      CompanyName: "Test Company",
      PositionState: "OPEN",
      EmploymentType: "FULL_TIME",
      YearsRequired: 2,
      Description: "Expired position",
      Timezone: "UTC",
      Deadline: expiredDeadline,
      PositionLocation: "Remote",
      DepartmentId: testData.testDepartment.DepartmentId,
    },
  });

  try {
    const response = await request(app)
      .get("/api/employee/positions-employee")
      .set("x-test-user-id", testData.testUser.UserId)
      .set("x-test-user-email", testData.testUser.Email)
      .set("x-test-user-role", "Employee")
      .set("x-test-employee-id", testData.testEmployee.EmployeeId)
      .query({ page: "1", limit: "100" });

    assert.equal(response.status, 200);
    // Should not include the expired position
    const expiredInResults = response.body.positions.some(
      (p) => p.PositionId === expiredPosition.PositionId
    );
    assert.equal(expiredInResults, false);

    // Try to get expired position details - should return 404
    const detailResponse = await request(app)
      .get(`/api/employee/positions-employee/${expiredPosition.PositionId}`)
      .set("x-test-user-id", testData.testUser.UserId)
      .set("x-test-user-email", testData.testUser.Email)
      .set("x-test-user-role", "Employee")
      .set("x-test-employee-id", testData.testEmployee.EmployeeId);

    assert.equal(detailResponse.status, 404);
  } finally {
    // Cleanup expired position
    await prisma.position.deleteMany({
      where: { PositionId: expiredPosition.PositionId },
    }).catch(() => {});
  }
});
