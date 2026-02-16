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

// Helper to create a confirmed referral for testing
const createConfirmedReferral = async () => {
  const cvBuffer = Buffer.from("%PDF-1.4 fake pdf content");
  const candidateEmail = `hr-test-${Date.now()}@example.com`;

  // Create referral as employee
  const createResponse = await request(app)
    .post("/api/employee/referral")
    .set("x-test-user-id", testData.testUser.UserId)
    .set("x-test-user-email", testData.testUser.Email)
    .set("x-test-user-role", "Employee")
    .set("x-test-employee-id", testData.testEmployee.EmployeeId)
    .field("candidateFirstName", "HR")
    .field("candidateLastName", "Test")
    .field("candidateEmail", candidateEmail)
    .field("candidatePhoneNumber", "+11234567890")
    .field("candidateYearOfExperience", "5")
    .field("positionId", testData.testPosition1.PositionId)
    .attach("cvFile", cvBuffer, "test-cv.pdf");

  if (createResponse.status !== 201) {
    throw new Error(`Failed to create referral: ${createResponse.body.message}`);
  }

  const referralId = createResponse.body.application.ReferralId;

  // Confirm the referral
  const confirmResponse = await request(app)
    .get(`/api/employee/referral/confirm/${referralId}`);

  if (confirmResponse.status !== 200) {
    // Cleanup if confirmation failed
    await prisma.application.deleteMany({
      where: { ReferralId: referralId },
    }).catch(() => {});
    await prisma.referral.deleteMany({
      where: { ReferralId: referralId },
    }).catch(() => {});
    throw new Error(`Failed to confirm referral: ${confirmResponse.body.message}`);
  }

  return {
    referralId,
    candidateId: createResponse.body.application.CandidateId,
    candidateEmail,
  };
};

test("GET /api/hr/referrals returns paginated confirmed referrals", async () => {
  // Create a confirmed referral first
  const { referralId, candidateEmail } = await createConfirmedReferral();

  try {
    const response = await request(app)
      .get("/api/hr/referrals")
      .set("x-test-user-id", hrTestData.testHrUser.UserId)
      .set("x-test-user-email", hrTestData.testHrUser.Email)
      .set("x-test-user-role", "HR")
      .set("x-test-hr-id", hrTestData.testHr.HrId)
      .set("x-test-hr-is-admin", "false")
      .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments))
      .query({ page: "1", pageSize: "10" });

    assert.equal(response.status, 200);
    assert.ok(Array.isArray(response.body.referrals));
    assert.equal(typeof response.body.page, "number");
    assert.equal(typeof response.body.pageSize, "number");
    assert.equal(typeof response.body.total, "number");
    assert.equal(typeof response.body.totalPages, "number");
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
  }
});

test("GET /api/hr/referrals/:referralId/details returns referral details", async () => {
  // Create a confirmed referral first
  const { referralId, candidateEmail } = await createConfirmedReferral();

  try {
    const response = await request(app)
      .get(`/api/hr/referrals/${referralId}/details`)
      .set("x-test-user-id", hrTestData.testHrUser.UserId)
      .set("x-test-user-email", hrTestData.testHrUser.Email)
      .set("x-test-user-role", "HR")
      .set("x-test-hr-id", hrTestData.testHr.HrId)
      .set("x-test-hr-is-admin", "false")
      .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments));

    assert.equal(response.status, 200);
    assert.ok(response.body.referral);
    assert.equal(response.body.referral.ReferralId, referralId);
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
  }
});

test("PATCH /api/hr/referrals/:referralId/advance advances referral stage", async () => {
  // Create a confirmed referral first
  const { referralId, candidateEmail } = await createConfirmedReferral();

  try {
    // Advance from Confirmed to InterviewOne
    const response = await request(app)
      .patch(`/api/hr/referrals/${referralId}/advance`)
      .set("x-test-user-id", hrTestData.testHrUser.UserId)
      .set("x-test-user-email", hrTestData.testHrUser.Email)
      .set("x-test-user-role", "HR")
      .set("x-test-hr-id", hrTestData.testHr.HrId)
      .set("x-test-hr-is-admin", "false")
      .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments));

    assert.equal(response.status, 200);
    assert.ok(response.body.message);
    assert.ok(response.body.referral);
    assert.equal(response.body.referral.Referral.Status, "InterviewOne");
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
  }
});

test("PATCH /api/hr/referrals/:referralId/finalize with Prospect action marks candidate as prospect", async () => {
  // Create a confirmed referral first
  const { referralId, candidateEmail } = await createConfirmedReferral();

  try {
    const response = await request(app)
      .patch(`/api/hr/referrals/${referralId}/finalize`)
      .set("x-test-user-id", hrTestData.testHrUser.UserId)
      .set("x-test-user-email", hrTestData.testHrUser.Email)
      .set("x-test-user-role", "HR")
      .set("x-test-hr-id", hrTestData.testHr.HrId)
      .set("x-test-hr-is-admin", "false")
      .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments))
      .send({
        action: "reject", // Maps to Prospect
      });

    assert.equal(response.status, 200);
    assert.ok(response.body.message);
    assert.ok(response.body.candidate);
    assert.equal(response.body.candidate.Referral.Prospect, true);
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
  }
});

test("PATCH /api/hr/referrals/:referralId/finalize with hire action hires candidate", async () => {
  // Create a confirmed referral and advance to Acceptance stage
  const { referralId, candidateEmail } = await createConfirmedReferral();

  try {
    // Advance through all stages to Acceptance
    await request(app)
      .patch(`/api/hr/referrals/${referralId}/advance`)
      .set("x-test-user-id", hrTestData.testHrUser.UserId)
      .set("x-test-user-email", hrTestData.testHrUser.Email)
      .set("x-test-user-role", "HR")
      .set("x-test-hr-id", hrTestData.testHr.HrId)
      .set("x-test-hr-is-admin", "false")
      .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments));

    await request(app)
      .patch(`/api/hr/referrals/${referralId}/advance`)
      .set("x-test-user-id", hrTestData.testHrUser.UserId)
      .set("x-test-user-email", hrTestData.testHrUser.Email)
      .set("x-test-user-role", "HR")
      .set("x-test-hr-id", hrTestData.testHr.HrId)
      .set("x-test-hr-is-admin", "false")
      .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments));

    await request(app)
      .patch(`/api/hr/referrals/${referralId}/advance`)
      .set("x-test-user-id", hrTestData.testHrUser.UserId)
      .set("x-test-user-email", hrTestData.testHrUser.Email)
      .set("x-test-user-role", "HR")
      .set("x-test-hr-id", hrTestData.testHr.HrId)
      .set("x-test-hr-is-admin", "false")
      .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments));

    // Now finalize with hire
    const response = await request(app)
      .patch(`/api/hr/referrals/${referralId}/finalize`)
      .set("x-test-user-id", hrTestData.testHrUser.UserId)
      .set("x-test-user-email", hrTestData.testHrUser.Email)
      .set("x-test-user-role", "HR")
      .set("x-test-hr-id", hrTestData.testHr.HrId)
      .set("x-test-hr-is-admin", "false")
      .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments))
      .send({
        action: "hire",
        compensation: 1000,
      });

    assert.equal(response.status, 200);
    assert.ok(response.body.message);
    assert.ok(response.body.candidate);
    assert.equal(response.body.candidate.Referral.Status, "Hired");

    // Verify compensation was created
    const compensation = await prisma.compensation.findFirst({
      where: {
        EmployeeId: testData.testEmployee.EmployeeId,
        HrId: hrTestData.testHr.HrId,
      },
    });
    assert.ok(compensation);
    assert.equal(compensation.Amount, 1000);
  } finally {
    // Cleanup
    await prisma.compensation.deleteMany({
      where: {
        EmployeeId: testData.testEmployee.EmployeeId,
        HrId: hrTestData.testHr.HrId,
      },
    }).catch(() => {});
    await prisma.application.deleteMany({
      where: { ReferralId: referralId },
    }).catch(() => {});
    await prisma.referral.deleteMany({
      where: { ReferralId: referralId },
    }).catch(() => {});
    await prisma.candidate.deleteMany({
      where: { Email: candidateEmail },
    }).catch(() => {});
  }
});

test("PATCH /api/hr/referrals/:referralId/unprospect clears prospect flag", async () => {
  // Create a confirmed referral and mark as prospect
  const { referralId, candidateEmail } = await createConfirmedReferral();

  try {
    // First mark as prospect
    await request(app)
      .patch(`/api/hr/referrals/${referralId}/finalize`)
      .set("x-test-user-id", hrTestData.testHrUser.UserId)
      .set("x-test-user-email", hrTestData.testHrUser.Email)
      .set("x-test-user-role", "HR")
      .set("x-test-hr-id", hrTestData.testHr.HrId)
      .set("x-test-hr-is-admin", "false")
      .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments))
      .send({
        action: "reject",
      });

    // Now unprospect
    const response = await request(app)
      .patch(`/api/hr/referrals/${referralId}/unprospect`)
      .set("x-test-user-id", hrTestData.testHrUser.UserId)
      .set("x-test-user-email", hrTestData.testHrUser.Email)
      .set("x-test-user-role", "HR")
      .set("x-test-hr-id", hrTestData.testHr.HrId)
      .set("x-test-hr-is-admin", "false")
      .set("x-test-hr-departments", JSON.stringify(hrTestData.hrWithDepts.Departments));

    assert.equal(response.status, 200);
    assert.ok(response.body.message);
    assert.ok(response.body.candidate);
    assert.equal(response.body.candidate.Referral.Prospect, false);
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
  }
});
