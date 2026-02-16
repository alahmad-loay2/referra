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

test("POST /api/employee/referral creates candidate, referral and application for open position", async () => {
  // Create a fake PDF buffer
  const cvBuffer = Buffer.from("%PDF-1.4 fake pdf content");

  const response = await request(app)
    .post("/api/employee/referral")
    .set("x-test-user-id", testData.testUser.UserId)
    .set("x-test-user-email", testData.testUser.Email)
    .set("x-test-user-role", "Employee")
    .set("x-test-employee-id", testData.testEmployee.EmployeeId)
    .field("candidateFirstName", "John")
    .field("candidateLastName", "Doe")
    .field("candidateEmail", `john-${Date.now()}@example.com`)
    .field("candidatePhoneNumber", "+11234567890")
    .field("candidateYearOfExperience", "5")
    .field("positionId", testData.testPosition1.PositionId)
    .attach("cvFile", cvBuffer, "test-cv.pdf");

  assert.equal(response.status, 201);
  assert.ok(response.body.message);
  assert.ok(response.body.application);
  assert.equal(response.body.application.Candidate.FirstName, "John");
  assert.equal(response.body.application.Candidate.LastName, "Doe");
  assert.equal(response.body.application.Position.PositionId, testData.testPosition1.PositionId);
  assert.ok(response.body.application.Referral);
  assert.equal(response.body.application.Referral.Status, "Pending");

  // Cleanup created referral
  if (response.body.application.ReferralId) {
    await prisma.application.deleteMany({
      where: { ReferralId: response.body.application.ReferralId },
    }).catch(() => {});
    await prisma.referral.deleteMany({
      where: { ReferralId: response.body.application.ReferralId },
    }).catch(() => {});
  }
  if (response.body.application.CandidateId) {
    await prisma.candidate.deleteMany({
      where: { CandidateId: response.body.application.CandidateId },
    }).catch(() => {});
  }
});

test("POST /api/employee/referral returns 400 for closed position", async () => {
  const cvBuffer = Buffer.from("%PDF-1.4 fake pdf content");

  const response = await request(app)
    .post("/api/employee/referral")
    .set("x-test-user-id", testData.testUser.UserId)
    .set("x-test-user-email", testData.testUser.Email)
    .set("x-test-user-role", "Employee")
    .set("x-test-employee-id", testData.testEmployee.EmployeeId)
    .field("candidateFirstName", "Jane")
    .field("candidateLastName", "Smith")
    .field("candidateEmail", `jane-${Date.now()}@example.com`)
    .field("candidatePhoneNumber", "+11234567890")
    .field("candidateYearOfExperience", "3")
    .field("positionId", testData.testPositionClosed.PositionId)
    .attach("cvFile", cvBuffer, "test-cv.pdf");

  assert.equal(response.status, 400);
  assert.ok(response.body.message);
});

test("GET /api/employee/referral/confirm/:referralId confirms referral for open position", async () => {
  // First create a referral
  const cvBuffer = Buffer.from("%PDF-1.4 fake pdf content");
  const candidateEmail = `confirm-test-${Date.now()}@example.com`;

  const createResponse = await request(app)
    .post("/api/employee/referral")
    .set("x-test-user-id", testData.testUser.UserId)
    .set("x-test-user-email", testData.testUser.Email)
    .set("x-test-user-role", "Employee")
    .set("x-test-employee-id", testData.testEmployee.EmployeeId)
    .field("candidateFirstName", "Confirm")
    .field("candidateLastName", "Test")
    .field("candidateEmail", candidateEmail)
    .field("candidatePhoneNumber", "+11234567890")
    .field("candidateYearOfExperience", "5")
    .field("positionId", testData.testPosition1.PositionId)
    .attach("cvFile", cvBuffer, "test-cv.pdf");

  assert.equal(createResponse.status, 201);
  const referralId = createResponse.body.application.ReferralId;

  // Now confirm the referral
  const confirmResponse = await request(app)
    .get(`/api/employee/referral/confirm/${referralId}`);

  assert.equal(confirmResponse.status, 200);
  assert.ok(confirmResponse.body.message);
  assert.ok(confirmResponse.body.referral);
  assert.equal(confirmResponse.body.referral.Status, "Confirmed");

  // Cleanup
  await prisma.application.deleteMany({
    where: { ReferralId: referralId },
  }).catch(() => {});
  await prisma.referral.deleteMany({
    where: { ReferralId: referralId },
  }).catch(() => {});
  await prisma.candidate.deleteMany({
    where: { Email: candidateEmail },
  }).catch(() => {});
});

test("GET /api/employee/referral/confirm/:referralId returns 400 for closed position", async () => {
  // Create a referral for a closed position (this should fail, but let's test confirmation)
  // Actually, we can't create a referral for closed position, so let's create one for open and then close the position
  const cvBuffer = Buffer.from("%PDF-1.4 fake pdf content");
  const candidateEmail = `closed-test-${Date.now()}@example.com`;

  const createResponse = await request(app)
    .post("/api/employee/referral")
    .set("x-test-user-id", testData.testUser.UserId)
    .set("x-test-user-email", testData.testUser.Email)
    .set("x-test-user-role", "Employee")
    .set("x-test-employee-id", testData.testEmployee.EmployeeId)
    .field("candidateFirstName", "Closed")
    .field("candidateLastName", "Test")
    .field("candidateEmail", candidateEmail)
    .field("candidatePhoneNumber", "+11234567890")
    .field("candidateYearOfExperience", "5")
    .field("positionId", testData.testPosition1.PositionId)
    .attach("cvFile", cvBuffer, "test-cv.pdf");

  assert.equal(createResponse.status, 201);
  const referralId = createResponse.body.application.ReferralId;
  const positionId = createResponse.body.application.PositionId;

  // Close the position
  await prisma.position.update({
    where: { PositionId: positionId },
    data: { PositionState: "CLOSED" },
  });

  try {
    // Try to confirm referral for closed position
    const confirmResponse = await request(app)
      .get(`/api/employee/referral/confirm/${referralId}`);

    assert.equal(confirmResponse.status, 400);
    assert.ok(confirmResponse.body.message);
  } finally {
    // Cleanup
    await prisma.application.deleteMany({
      where: { ReferralId: referralId },
    }).catch(() => {});
    await prisma.referral.deleteMany({
      where: { ReferralId: referralId },
    }).catch(() => {});
    await prisma.candidate.deleteMany({
      where: { Email: candidateEmail },
    }).catch(() => {});
    // Reopen position
    await prisma.position.update({
      where: { PositionId: positionId },
      data: { PositionState: "OPEN" },
    }).catch(() => {});
  }
});

test("DELETE /api/employee/referral/:referralId removes application and referral but keeps candidate when other applications exist", async () => {
  // Create two referrals for the same candidate
  const cvBuffer = Buffer.from("%PDF-1.4 fake pdf content");
  const candidateEmail = `multi-ref-${Date.now()}@example.com`;

  // Create first referral
  const createResponse1 = await request(app)
    .post("/api/employee/referral")
    .set("x-test-user-id", testData.testUser.UserId)
    .set("x-test-user-email", testData.testUser.Email)
    .set("x-test-user-role", "Employee")
    .set("x-test-employee-id", testData.testEmployee.EmployeeId)
    .field("candidateFirstName", "Multi")
    .field("candidateLastName", "Ref")
    .field("candidateEmail", candidateEmail)
    .field("candidatePhoneNumber", "+11234567890")
    .field("candidateYearOfExperience", "5")
    .field("positionId", testData.testPosition1.PositionId)
    .attach("cvFile", cvBuffer, "test-cv.pdf");

  assert.equal(createResponse1.status, 201);
  const referralId1 = createResponse1.body.application.ReferralId;
  const candidateId = createResponse1.body.application.CandidateId;

  // Create second referral for same candidate
  const createResponse2 = await request(app)
    .post("/api/employee/referral")
    .set("x-test-user-id", testData.testUser.UserId)
    .set("x-test-user-email", testData.testUser.Email)
    .set("x-test-user-role", "Employee")
    .set("x-test-employee-id", testData.testEmployee.EmployeeId)
    .field("candidateFirstName", "Multi")
    .field("candidateLastName", "Ref")
    .field("candidateEmail", candidateEmail)
    .field("candidatePhoneNumber", "+11234567890")
    .field("candidateYearOfExperience", "5")
    .field("positionId", testData.testPosition2.PositionId)
    .attach("cvFile", cvBuffer, "test-cv.pdf");

  assert.equal(createResponse2.status, 201);
  const referralId2 = createResponse2.body.application.ReferralId;

  // Delete first referral
  const deleteResponse = await request(app)
    .delete(`/api/employee/referral/${referralId1}`)
    .set("x-test-user-id", testData.testUser.UserId)
    .set("x-test-user-email", testData.testUser.Email)
    .set("x-test-user-role", "Employee")
    .set("x-test-employee-id", testData.testEmployee.EmployeeId);

  assert.equal(deleteResponse.status, 200);
  assert.ok(deleteResponse.body.message);
  assert.equal(deleteResponse.body.deletedCandidate, false);

  // Verify candidate still exists
  const candidate = await prisma.candidate.findUnique({
    where: { CandidateId: candidateId },
  });
  assert.ok(candidate);

  // Cleanup
  await prisma.application.deleteMany({
    where: { ReferralId: { in: [referralId1, referralId2] } },
  }).catch(() => {});
  await prisma.referral.deleteMany({
    where: { ReferralId: { in: [referralId1, referralId2] } },
  }).catch(() => {});
  await prisma.candidate.deleteMany({
    where: { CandidateId: candidateId },
  }).catch(() => {});
});

test("DELETE /api/employee/referral/:referralId also removes candidate when it's their only application", async () => {
  // Create a referral
  const cvBuffer = Buffer.from("%PDF-1.4 fake pdf content");
  const candidateEmail = `single-ref-${Date.now()}@example.com`;

  const createResponse = await request(app)
    .post("/api/employee/referral")
    .set("x-test-user-id", testData.testUser.UserId)
    .set("x-test-user-email", testData.testUser.Email)
    .set("x-test-user-role", "Employee")
    .set("x-test-employee-id", testData.testEmployee.EmployeeId)
    .field("candidateFirstName", "Single")
    .field("candidateLastName", "Ref")
    .field("candidateEmail", candidateEmail)
    .field("candidatePhoneNumber", "+11234567890")
    .field("candidateYearOfExperience", "5")
    .field("positionId", testData.testPosition1.PositionId)
    .attach("cvFile", cvBuffer, "test-cv.pdf");

  assert.equal(createResponse.status, 201);
  const referralId = createResponse.body.application.ReferralId;
  const candidateId = createResponse.body.application.CandidateId;

  // Delete the referral
  const deleteResponse = await request(app)
    .delete(`/api/employee/referral/${referralId}`)
    .set("x-test-user-id", testData.testUser.UserId)
    .set("x-test-user-email", testData.testUser.Email)
    .set("x-test-user-role", "Employee")
    .set("x-test-employee-id", testData.testEmployee.EmployeeId);

  assert.equal(deleteResponse.status, 200);
  assert.ok(deleteResponse.body.message);
  assert.equal(deleteResponse.body.deletedCandidate, true);

  // Verify candidate is deleted
  const candidate = await prisma.candidate.findUnique({
    where: { CandidateId: candidateId },
  });
  assert.equal(candidate, null);
});

test("GET /api/employee/applications returns paginated applications for employee", async () => {
  // Create a referral first
  const cvBuffer = Buffer.from("%PDF-1.4 fake pdf content");
  const candidateEmail = `paginated-${Date.now()}@example.com`;

  const createResponse = await request(app)
    .post("/api/employee/referral")
    .set("x-test-user-id", testData.testUser.UserId)
    .set("x-test-user-email", testData.testUser.Email)
    .set("x-test-user-role", "Employee")
    .set("x-test-employee-id", testData.testEmployee.EmployeeId)
    .field("candidateFirstName", "Paginated")
    .field("candidateLastName", "Test")
    .field("candidateEmail", candidateEmail)
    .field("candidatePhoneNumber", "+11234567890")
    .field("candidateYearOfExperience", "5")
    .field("positionId", testData.testPosition1.PositionId)
    .attach("cvFile", cvBuffer, "test-cv.pdf");

  assert.equal(createResponse.status, 201);
  const referralId = createResponse.body.application.ReferralId;

  // Get applications
  const getResponse = await request(app)
    .get("/api/employee/applications")
    .set("x-test-user-id", testData.testUser.UserId)
    .set("x-test-user-email", testData.testUser.Email)
    .set("x-test-user-role", "Employee")
    .set("x-test-employee-id", testData.testEmployee.EmployeeId)
    .query({ page: "1", pageSize: "10" });

  assert.equal(getResponse.status, 200);
  assert.ok(Array.isArray(getResponse.body.applications));
  assert.equal(typeof getResponse.body.page, "number");
  assert.equal(typeof getResponse.body.pageSize, "number");
  assert.equal(typeof getResponse.body.totalReferrals, "number");
  assert.equal(typeof getResponse.body.totalPages, "number");

  // Cleanup
  await prisma.application.deleteMany({
    where: { ReferralId: referralId },
  }).catch(() => {});
  await prisma.referral.deleteMany({
    where: { ReferralId: referralId },
  }).catch(() => {});
  await prisma.candidate.deleteMany({
    where: { Email: candidateEmail },
  }).catch(() => {});
});

test("PUT /api/employee/candidate/:candidateId updates candidate fields", async () => {
  // Create a referral first
  const cvBuffer = Buffer.from("%PDF-1.4 fake pdf content");
  const candidateEmail = `edit-test-${Date.now()}@example.com`;

  const createResponse = await request(app)
    .post("/api/employee/referral")
    .set("x-test-user-id", testData.testUser.UserId)
    .set("x-test-user-email", testData.testUser.Email)
    .set("x-test-user-role", "Employee")
    .set("x-test-employee-id", testData.testEmployee.EmployeeId)
    .field("candidateFirstName", "Edit")
    .field("candidateLastName", "Test")
    .field("candidateEmail", candidateEmail)
    .field("candidatePhoneNumber", "+11234567890")
    .field("candidateYearOfExperience", "5")
    .field("positionId", testData.testPosition1.PositionId)
    .attach("cvFile", cvBuffer, "test-cv.pdf");

  assert.equal(createResponse.status, 201);
  const candidateId = createResponse.body.application.CandidateId;
  const referralId = createResponse.body.application.ReferralId;

  // Update candidate
  const updateResponse = await request(app)
    .put(`/api/employee/candidate/${candidateId}`)
    .set("x-test-user-id", testData.testUser.UserId)
    .set("x-test-user-email", testData.testUser.Email)
    .set("x-test-user-role", "Employee")
    .set("x-test-employee-id", testData.testEmployee.EmployeeId)
    .field("candidateFirstName", "Updated")
    .field("candidatePhoneNumber", "+19876543210")
    .field("candidateYearOfExperience", "10");

  assert.equal(updateResponse.status, 200);
  assert.ok(updateResponse.body.updatedCandidate);
  assert.equal(updateResponse.body.updatedCandidate.FirstName, "Updated");
  assert.equal(updateResponse.body.updatedCandidate.PhoneNumber, "+19876543210");
  assert.equal(updateResponse.body.updatedCandidate.YearOfExperience, 10);

  // Cleanup
  await prisma.application.deleteMany({
    where: { ReferralId: referralId },
  }).catch(() => {});
  await prisma.referral.deleteMany({
    where: { ReferralId: referralId },
  }).catch(() => {});
  await prisma.candidate.deleteMany({
    where: { CandidateId: candidateId },
  }).catch(() => {});
});

test("GET /api/employee/referrals/:referralId returns application details", async () => {
  // Create a referral first
  const cvBuffer = Buffer.from("%PDF-1.4 fake pdf content");
  const candidateEmail = `details-test-${Date.now()}@example.com`;

  const createResponse = await request(app)
    .post("/api/employee/referral")
    .set("x-test-user-id", testData.testUser.UserId)
    .set("x-test-user-email", testData.testUser.Email)
    .set("x-test-user-role", "Employee")
    .set("x-test-employee-id", testData.testEmployee.EmployeeId)
    .field("candidateFirstName", "Details")
    .field("candidateLastName", "Test")
    .field("candidateEmail", candidateEmail)
    .field("candidatePhoneNumber", "+11234567890")
    .field("candidateYearOfExperience", "5")
    .field("positionId", testData.testPosition1.PositionId)
    .attach("cvFile", cvBuffer, "test-cv.pdf");

  assert.equal(createResponse.status, 201);
  const referralId = createResponse.body.application.ReferralId;
  const candidateId = createResponse.body.application.CandidateId;

  // Get referral details
  const detailsResponse = await request(app)
    .get(`/api/employee/referrals/${referralId}`)
    .set("x-test-user-id", testData.testUser.UserId)
    .set("x-test-user-email", testData.testUser.Email)
    .set("x-test-user-role", "Employee")
    .set("x-test-employee-id", testData.testEmployee.EmployeeId);

  assert.equal(detailsResponse.status, 200);
  assert.ok(detailsResponse.body.ReferralId);
  assert.equal(detailsResponse.body.ReferralId, referralId);
  assert.equal(detailsResponse.body.CandidateId, candidateId);
  assert.ok(detailsResponse.body.EmployeeId);
  assert.ok(detailsResponse.body.PositionId);

  // Cleanup
  await prisma.application.deleteMany({
    where: { ReferralId: referralId },
  }).catch(() => {});
  await prisma.referral.deleteMany({
    where: { ReferralId: referralId },
  }).catch(() => {});
  await prisma.candidate.deleteMany({
    where: { CandidateId: candidateId },
  }).catch(() => {});
});
