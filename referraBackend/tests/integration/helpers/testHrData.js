import { prisma } from "../../../lib/prisma.js";
import { randomUUID } from "crypto";

/**
 * Creates HR test data for integration tests
 * Returns created data for cleanup
 */
export const createHrTestData = async () => {
  // Generate UUIDs for test data to ensure uniqueness
  const testHrUserId = randomUUID();
  const testAdminHrUserId = randomUUID();
  const testDepartment1Id = randomUUID();
  const testDepartment2Id = randomUUID();
  const emailSuffix = randomUUID();

  // Create test departments
  const testDepartment1 = await prisma.department.create({
    data: {
      DepartmentId: testDepartment1Id,
      DepartmentName: `Test HR Department 1 ${randomUUID()}`,
    },
  });

  const testDepartment2 = await prisma.department.create({
    data: {
      DepartmentId: testDepartment2Id,
      DepartmentName: `Test HR Department 2 ${randomUUID()}`,
    },
  });

  // Create a test HR user
  const testHrUser = await prisma.users.create({
    data: {
      UserId: testHrUserId,
      FirstName: "Test",
      LastName: "HR",
      Age: 35,
      PhoneNumber: "1234567890",
      Gender: "Male",
      Email: `testhr-${emailSuffix}@integration.test`,
      Role: "HR",
    },
  });

  // Create HR record
  const testHr = await prisma.hr.create({
    data: {
      UserId: testHrUser.UserId,
      isAdmin: false,
    },
  });

  // Link HR to departments
  await prisma.hrDepartment.create({
    data: {
      HrId: testHr.HrId,
      DepartmentId: testDepartment1.DepartmentId,
    },
  });

  await prisma.hrDepartment.create({
    data: {
      HrId: testHr.HrId,
      DepartmentId: testDepartment2.DepartmentId,
    },
  });

  // Create employee record for HR (HR users can also submit referrals)
  const testHrEmployee = await prisma.employee.create({
    data: {
      UserId: testHrUser.UserId,
      Department: "HR",
      Position: "HR Manager",
      TotalCompensation: 0,
    },
  });

  // Create admin HR user
  const testAdminHrUser = await prisma.users.create({
    data: {
      UserId: testAdminHrUserId,
      FirstName: "Test",
      LastName: "Admin",
      Age: 40,
      PhoneNumber: "0987654321",
      Gender: "Female",
      Email: `testadmin-${emailSuffix}@integration.test`,
      Role: "HR",
    },
  });

  const testAdminHr = await prisma.hr.create({
    data: {
      UserId: testAdminHrUser.UserId,
      isAdmin: true,
    },
  });

  // Link admin HR to department 1
  await prisma.hrDepartment.create({
    data: {
      HrId: testAdminHr.HrId,
      DepartmentId: testDepartment1.DepartmentId,
    },
  });

  // Create employee record for admin HR
  const testAdminHrEmployee = await prisma.employee.create({
    data: {
      UserId: testAdminHrUser.UserId,
      Department: "HR",
      Position: "HR Admin",
      TotalCompensation: 0,
    },
  });

  // Fetch HR with departments for proper structure
  const hrWithDepts = await prisma.hr.findUnique({
    where: { HrId: testHr.HrId },
    include: {
      Departments: {
        include: {
          Department: true,
        },
      },
    },
  });

  const adminHrWithDepts = await prisma.hr.findUnique({
    where: { HrId: testAdminHr.HrId },
    include: {
      Departments: {
        include: {
          Department: true,
        },
      },
    },
  });

  return {
    testHrUser,
    testHr,
    testHrEmployee,
    testAdminHrUser,
    testAdminHr,
    testAdminHrEmployee,
    testDepartment1,
    testDepartment2,
    hrWithDepts,
    adminHrWithDepts,
  };
};

/**
 * Cleans up HR test data
 */
export const cleanupHrTestData = async (hrTestData) => {
  if (!hrTestData) {
    return;
  }

  try {
    // Delete HR department links
    if (hrTestData.testHr) {
      await prisma.hrDepartment.deleteMany({
        where: { HrId: hrTestData.testHr.HrId },
      }).catch(() => {});
    }
    if (hrTestData.testAdminHr) {
      await prisma.hrDepartment.deleteMany({
        where: { HrId: hrTestData.testAdminHr.HrId },
      }).catch(() => {});
    }

    // Delete employees
    if (hrTestData.testHrEmployee) {
      await prisma.employee.deleteMany({
        where: { EmployeeId: hrTestData.testHrEmployee.EmployeeId },
      }).catch(() => {});
    }
    if (hrTestData.testAdminHrEmployee) {
      await prisma.employee.deleteMany({
        where: { EmployeeId: hrTestData.testAdminHrEmployee.EmployeeId },
      }).catch(() => {});
    }

    // Delete HR records
    if (hrTestData.testHr) {
      await prisma.hr.deleteMany({
        where: { HrId: hrTestData.testHr.HrId },
      }).catch(() => {});
    }
    if (hrTestData.testAdminHr) {
      await prisma.hr.deleteMany({
        where: { HrId: hrTestData.testAdminHr.HrId },
      }).catch(() => {});
    }

    // Delete users
    if (hrTestData.testHrUser) {
      await prisma.users.deleteMany({
        where: { UserId: hrTestData.testHrUser.UserId },
      }).catch(() => {});
    }
    if (hrTestData.testAdminHrUser) {
      await prisma.users.deleteMany({
        where: { UserId: hrTestData.testAdminHrUser.UserId },
      }).catch(() => {});
    }

    // Delete departments (after positions are deleted)
    if (hrTestData.testDepartment1) {
      await prisma.department.deleteMany({
        where: { DepartmentId: hrTestData.testDepartment1.DepartmentId },
      }).catch(() => {});
    }
    if (hrTestData.testDepartment2) {
      await prisma.department.deleteMany({
        where: { DepartmentId: hrTestData.testDepartment2.DepartmentId },
      }).catch(() => {});
    }
  } catch (error) {
    console.error("Error cleaning up HR test data:", error);
  }
};
