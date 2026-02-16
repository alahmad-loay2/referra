import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { randomUUID } from "crypto";
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
    
    // Link HR to testData department so they can access testData positions
    await prisma.hrDepartment.create({
      data: {
        HrId: hrTestData.testHr.HrId,
        DepartmentId: testData.testDepartment.DepartmentId,
      },
    }).catch(() => {}); // Ignore if already exists
    
    // Refresh hrWithDepts to include the new department
    hrTestData.hrWithDepts = await prisma.hr.findUnique({
      where: { HrId: hrTestData.testHr.HrId },
      include: {
        Departments: {
          include: {
            Department: true,
          },
        },
      },
    });
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

test("POST /api/hr/positions creates a position successfully", async () => {
  const futureDeadline = new Date();
  futureDeadline.setDate(futureDeadline.getDate() + 30);

  const response = await request(app)
    .post("/api/hr/positions")
    .set("x-test-user-id", hrTestData.testHrUser.UserId)
    .set("x-test-user-email", hrTestData.testHrUser.Email)
    .set("x-test-user-role", "HR")
    .set("x-test-hr-id", hrTestData.testHr.HrId)
    .set("x-test-hr-is-admin", "false")
    .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments))
    .send({
      positionTitle: "Senior Software Engineer",
      companyName: "Test Company",
      yearsRequired: 5,
      description: "Test position description",
      timeZone: "UTC",
      deadline: futureDeadline.toISOString(),
      positionLocation: "Remote",
      departmentId: hrTestData.testDepartment1.DepartmentId,
      employmentType: "FULL_TIME",
    });

  assert.equal(response.status, 201);
  assert.ok(response.body.message);
  assert.ok(response.body.position);
  assert.equal(response.body.position.PositionTitle, "Senior Software Engineer");
  assert.equal(response.body.position.CompanyName, "Test Company");
  assert.equal(response.body.position.PositionState, "OPEN");

  // Cleanup
  await prisma.position.deleteMany({
    where: { PositionId: response.body.position.PositionId },
  }).catch(() => {});
});

test("PATCH /api/hr/positions/:positionId/state updates position state", async () => {
  // Create a position first
  const futureDeadline = new Date();
  futureDeadline.setDate(futureDeadline.getDate() + 30);

  const position = await prisma.position.create({
    data: {
      PositionTitle: "Test Position",
      CompanyName: "Test Company",
      PositionState: "OPEN",
      EmploymentType: "FULL_TIME",
      YearsRequired: 3,
      Description: "Test",
      Timezone: "UTC",
      Deadline: futureDeadline,
      PositionLocation: "Remote",
      DepartmentId: hrTestData.testDepartment1.DepartmentId,
    },
  });

  // Close the position
  const closeResponse = await request(app)
    .patch(`/api/hr/positions/${position.PositionId}/state`)
    .set("x-test-user-id", hrTestData.testHrUser.UserId)
    .set("x-test-user-email", hrTestData.testHrUser.Email)
    .set("x-test-user-role", "HR")
    .set("x-test-hr-id", hrTestData.testHr.HrId)
    .set("x-test-hr-is-admin", "false")
    .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments))
    .send({ state: "CLOSED" });

  assert.equal(closeResponse.status, 200);
  assert.equal(closeResponse.body.position.PositionState, "CLOSED");

  // Reopen the position
  const openResponse = await request(app)
    .patch(`/api/hr/positions/${position.PositionId}/state`)
    .set("x-test-user-id", hrTestData.testHrUser.UserId)
    .set("x-test-user-email", hrTestData.testHrUser.Email)
    .set("x-test-user-role", "HR")
    .set("x-test-hr-id", hrTestData.testHr.HrId)
    .set("x-test-hr-is-admin", "false")
    .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments))
    .send({ state: "OPEN" });

  assert.equal(openResponse.status, 200);
  assert.equal(openResponse.body.position.PositionState, "OPEN");

  // Cleanup
  await prisma.position.deleteMany({
    where: { PositionId: position.PositionId },
  }).catch(() => {});
});

test("PUT /api/hr/positions/:positionId updates position details", async () => {
  // Create a position first
  const futureDeadline = new Date();
  futureDeadline.setDate(futureDeadline.getDate() + 30);

  const position = await prisma.position.create({
    data: {
      PositionTitle: "Original Title",
      CompanyName: "Original Company",
      PositionState: "OPEN",
      EmploymentType: "FULL_TIME",
      YearsRequired: 3,
      Description: "Original description",
      Timezone: "UTC",
      Deadline: futureDeadline,
      PositionLocation: "Remote",
      DepartmentId: hrTestData.testDepartment1.DepartmentId,
    },
  });

  const newDeadline = new Date();
  newDeadline.setDate(newDeadline.getDate() + 60);

  const response = await request(app)
    .put(`/api/hr/positions/${position.PositionId}`)
    .set("x-test-user-id", hrTestData.testHrUser.UserId)
    .set("x-test-user-email", hrTestData.testHrUser.Email)
    .set("x-test-user-role", "HR")
    .set("x-test-hr-id", hrTestData.testHr.HrId)
    .set("x-test-hr-is-admin", "false")
    .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments))
    .send({
      positionTitle: "Updated Title",
      companyName: "Updated Company",
      yearsRequired: 7,
      description: "Updated description",
      timeZone: "EST",
      deadline: newDeadline.toISOString(),
      positionLocation: "Hybrid",
    });

  assert.equal(response.status, 200);
  assert.equal(response.body.position.PositionTitle, "Updated Title");
  assert.equal(response.body.position.CompanyName, "Updated Company");
  assert.equal(response.body.position.YearsRequired, 7);

  // Cleanup
  await prisma.position.deleteMany({
    where: { PositionId: position.PositionId },
  }).catch(() => {});
});

test("GET /api/hr/positions-hr returns paginated positions for HR", async () => {
  const response = await request(app)
    .get("/api/hr/positions-hr")
    .set("x-test-user-id", hrTestData.testHrUser.UserId)
    .set("x-test-user-email", hrTestData.testHrUser.Email)
    .set("x-test-user-role", "HR")
    .set("x-test-hr-id", hrTestData.testHr.HrId)
    .set("x-test-hr-is-admin", "false")
    .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments))
    .query({ page: "1", limit: "10" });

  assert.equal(response.status, 200);
  assert.ok(response.body.positions);
  assert.ok(Array.isArray(response.body.positions));
  assert.equal(typeof response.body.total, "number");
  assert.equal(typeof response.body.page, "number");
  assert.equal(typeof response.body.limit, "number");
});

test("GET /api/hr/positions-hr/:positionId returns position details", async () => {
  const response = await request(app)
    .get(`/api/hr/positions-hr/${testData.testPosition1.PositionId}`)
    .set("x-test-user-id", hrTestData.testHrUser.UserId)
    .set("x-test-user-email", hrTestData.testHrUser.Email)
    .set("x-test-user-role", "HR")
    .set("x-test-hr-id", hrTestData.testHr.HrId)
    .set("x-test-hr-is-admin", "false")
    .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments));

  assert.equal(response.status, 200);
  assert.equal(response.body.PositionId, testData.testPosition1.PositionId);
  assert.ok(response.body.applicantsCount !== undefined);
});

test("DELETE /api/hr/positions/:positionId deletes position", async () => {
  // Create a position first
  const futureDeadline = new Date();
  futureDeadline.setDate(futureDeadline.getDate() + 30);

  const position = await prisma.position.create({
    data: {
      PositionTitle: "To Delete",
      CompanyName: "Test Company",
      PositionState: "OPEN",
      EmploymentType: "FULL_TIME",
      YearsRequired: 3,
      Description: "Test",
      Timezone: "UTC",
      Deadline: futureDeadline,
      PositionLocation: "Remote",
      DepartmentId: hrTestData.testDepartment1.DepartmentId,
    },
  });

  const response = await request(app)
    .delete(`/api/hr/positions/${position.PositionId}`)
    .set("x-test-user-id", hrTestData.testHrUser.UserId)
    .set("x-test-user-email", hrTestData.testHrUser.Email)
    .set("x-test-user-role", "HR")
    .set("x-test-hr-id", hrTestData.testHr.HrId)
    .set("x-test-hr-is-admin", "false")
    .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments));

  assert.equal(response.status, 200);
  assert.ok(response.body.message);

  // Verify position is deleted
  const deletedPosition = await prisma.position.findUnique({
    where: { PositionId: position.PositionId },
  });
  assert.equal(deletedPosition, null);
});

test("GET /api/hr/departments-hr returns HR departments", async () => {
  const response = await request(app)
    .get("/api/hr/departments-hr")
    .set("x-test-user-id", hrTestData.testHrUser.UserId)
    .set("x-test-user-email", hrTestData.testHrUser.Email)
    .set("x-test-user-role", "HR")
    .set("x-test-hr-id", hrTestData.testHr.HrId)
    .set("x-test-hr-is-admin", "false")
    .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments));

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body));
  assert.ok(response.body.length >= 2); // Should have at least the 2 test departments
});
