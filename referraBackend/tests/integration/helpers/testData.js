import { prisma } from "../../../lib/prisma.js";
import { randomUUID } from "crypto";

/**
 * Cleans up any orphaned test data from previous failed test runs
 * Only cleans up data that's clearly from integration tests
 */
const cleanupOrphanedTestData = async () => {
  try {
    // Find users with integration test emails that might be orphaned
    const oldTestUsers = await prisma.users.findMany({
      where: {
        Email: { contains: "@integration.test" },
        CreatedAt: { lt: new Date(Date.now() - 30 * 60 * 1000) }, // Older than 30 minutes
      },
      include: {
        Employee: {
          include: {
            Application: true,
          },
        },
      },
    }).catch(() => []);

    for (const user of oldTestUsers) {
      if (user.Employee) {
        // Delete applications and referrals
        for (const app of user.Employee.Application) {
          await prisma.application.deleteMany({
            where: { ReferralId: app.ReferralId },
          }).catch(() => {});
          await prisma.referral.deleteMany({
            where: { ReferralId: app.ReferralId },
          }).catch(() => {});
        }
        // Delete employee
        await prisma.employee.deleteMany({
          where: { EmployeeId: user.Employee.EmployeeId },
        }).catch(() => {});
      }
      // Delete user
      await prisma.users.deleteMany({
        where: { UserId: user.UserId },
      }).catch(() => {});
    }
  } catch (error) {
    // Ignore cleanup errors - this is just a best-effort cleanup
  }
};

/**
 * Creates test data for integration tests
 * Returns created data for cleanup
 */
export const createTestData = async () => {
  // Clean up any orphaned test data first
  await cleanupOrphanedTestData();
  // Generate UUIDs for test data to ensure uniqueness
  const testUserId = randomUUID();
  const testDepartmentId = randomUUID();
  const emailSuffix = randomUUID();

  // Create a test user
  const testUser = await prisma.users.create({
    data: {
      UserId: testUserId,
      FirstName: "Test",
      LastName: "Employee",
      Age: 30,
      PhoneNumber: "1234567890",
      Gender: "Male",
      Email: `testemployee-${emailSuffix}@integration.test`,
      Role: "Employee",
    },
  });

  // Create a test employee
  const testEmployee = await prisma.employee.create({
    data: {
      UserId: testUser.UserId,
      Department: "Engineering",
      Position: "Software Engineer",
      TotalCompensation: 0,
    },
  });

  // Create a test department
  const testDepartment = await prisma.department.create({
    data: {
      DepartmentId: testDepartmentId,
      DepartmentName: `Test Engineering Department ${randomUUID()}`,
    },
  });

  // Create test positions
  const futureDeadline = new Date();
  futureDeadline.setDate(futureDeadline.getDate() + 30); // 30 days from now

  const testPosition1 = await prisma.position.create({
    data: {
      PositionTitle: "Senior Software Engineer",
      CompanyName: "Test Company",
      PositionState: "OPEN",
      EmploymentType: "FULL_TIME",
      YearsRequired: 5,
      Description: "Test position description",
      Timezone: "UTC",
      Deadline: futureDeadline,
      PositionLocation: "Remote",
      DepartmentId: testDepartment.DepartmentId,
    },
  });

  const testPosition2 = await prisma.position.create({
    data: {
      PositionTitle: "Junior Developer",
      CompanyName: "Test Company",
      PositionState: "OPEN",
      EmploymentType: "FULL_TIME",
      YearsRequired: 1,
      Description: "Test position description 2",
      Timezone: "UTC",
      Deadline: futureDeadline,
      PositionLocation: "Hybrid",
      DepartmentId: testDepartment.DepartmentId,
    },
  });

  // Create a closed position
  const pastDeadline = new Date();
  pastDeadline.setDate(pastDeadline.getDate() - 1); // 1 day ago

  const testPositionClosed = await prisma.position.create({
    data: {
      PositionTitle: "Closed Position",
      CompanyName: "Test Company",
      PositionState: "CLOSED",
      EmploymentType: "FULL_TIME",
      YearsRequired: 3,
      Description: "Closed position description",
      Timezone: "UTC",
      Deadline: pastDeadline,
      PositionLocation: "On-site",
      DepartmentId: testDepartment.DepartmentId,
    },
  });

  return {
    testUser,
    testEmployee,
    testDepartment,
    testPosition1,
    testPosition2,
    testPositionClosed,
  };
};

/**
 * Cleans up test data created during tests
 * Must delete in order: Applications -> Referrals -> Candidates -> Positions -> Employees -> Users -> Departments
 */
export const cleanupTestData = async (testData) => {
  // Handle case where testData is undefined or incomplete (e.g., if setup failed)
  if (!testData) {
    return;
  }

  try {
    const positionIds = [
      testData.testPosition1?.PositionId,
      testData.testPosition2?.PositionId,
      testData.testPositionClosed?.PositionId,
    ].filter(Boolean);
    
    const employeeId = testData.testEmployee?.EmployeeId;
    
    // Step 1: Delete all applications that reference our test positions or employee
    if (positionIds.length > 0 || employeeId) {
      const whereClause = {};
      if (positionIds.length > 0 && employeeId) {
        whereClause.OR = [
          { PositionId: { in: positionIds } },
          { EmployeeId: employeeId },
        ];
      } else if (positionIds.length > 0) {
        whereClause.PositionId = { in: positionIds };
      } else if (employeeId) {
        whereClause.EmployeeId = employeeId;
      }
      
      // Get referral IDs and candidate IDs before deleting applications
      const applications = await prisma.application.findMany({
        where: whereClause,
        select: { ReferralId: true, CandidateId: true },
      }).catch(() => []);
      
      const referralIds = [...new Set(applications.map(app => app.ReferralId).filter(Boolean))];
      const candidateIds = [...new Set(applications.map(app => app.CandidateId).filter(Boolean))];
      
      // Delete applications
      await prisma.application.deleteMany({
        where: whereClause,
      }).catch(() => {});
      
      // Step 2: Delete referrals
      if (referralIds.length > 0) {
        await prisma.referral.deleteMany({
          where: { ReferralId: { in: referralIds } },
        }).catch(() => {});
      }
      
      // Step 3: Delete candidates that have no remaining applications
      for (const candidateId of candidateIds) {
        const remainingApps = await prisma.application.findMany({
          where: { CandidateId: candidateId },
        }).catch(() => []);
        
        if (remainingApps.length === 0) {
          await prisma.candidate.deleteMany({
            where: { CandidateId: candidateId },
          }).catch(() => {});
        }
      }
    }
    
    // Step 4: Delete positions (after applications are deleted)
    if (testData.testPosition1) {
      await prisma.position.deleteMany({
        where: { PositionId: testData.testPosition1.PositionId },
      }).catch(() => {});
    }
    if (testData.testPosition2) {
      await prisma.position.deleteMany({
        where: { PositionId: testData.testPosition2.PositionId },
      }).catch(() => {});
    }
    if (testData.testPositionClosed) {
      await prisma.position.deleteMany({
        where: { PositionId: testData.testPositionClosed.PositionId },
      }).catch(() => {});
    }
    
    // Step 5: Delete employee (after applications are deleted)
    if (testData.testEmployee) {
      await prisma.employee.deleteMany({
        where: { EmployeeId: testData.testEmployee.EmployeeId },
      }).catch(() => {});
    }
    
    // Step 6: Delete user (after employee is deleted)
    if (testData.testUser) {
      await prisma.users.deleteMany({
        where: { UserId: testData.testUser.UserId },
      }).catch(() => {});
    }
    
    // Step 7: Delete department (after positions are deleted)
    if (testData.testDepartment) {
      await prisma.department.deleteMany({
        where: { DepartmentId: testData.testDepartment.DepartmentId },
      }).catch(() => {});
    }
  } catch (error) {
    console.error("Error cleaning up test data:", error);
  }
};
