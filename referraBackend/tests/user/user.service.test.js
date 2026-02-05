import test from "node:test";
import assert from "node:assert/strict";

import {
  getUserInfo,
  updateUserInfo,
} from "../../services/user/user.service.js";
import { prisma } from "../../lib/prisma.js";

test("getUserInfo returns user with role-specific relations", async () => {
  const userId = 1;

  const fakeUser = {
    UserId: userId,
    FirstName: "Jane",
    LastName: "Doe",
    Role: "Employee",
    Employee: { EmployeeId: 10 },
    Hr: {
      HrId: 20,
      Departments: [
        { Department: { DepartmentId: 1, Name: "Engineering" } },
        { Department: { DepartmentId: 2, Name: "Sales" } },
      ],
    },
  };

  const originalFindUnique = prisma.users?.findUnique;

  prisma.users.findUnique = async () => fakeUser;

  try {
    const result = await getUserInfo(userId);

    assert.equal(result.UserId, userId);
    assert.equal(result.FirstName, "Jane");
    assert.equal(result.Employee.EmployeeId, 10);
    assert.equal(result.Hr.Departments.length, 2);
    assert.equal(result.Hr.Departments[0].Department.Name, "Engineering");
  } finally {
    prisma.users.findUnique = originalFindUnique;
  }
});

test("updateUserInfo updates basic user fields and employee details", async () => {
  const userId = 2;

  const existingUser = {
    UserId: userId,
    Role: "Employee",
    Employee: { EmployeeId: 30 },
  };

  const payload = {
    firstName: "Updated",
    lastName: "User",
    age: 28,
    phoneNumber: "123456789",
    gender: "Female",
    department: "Engineering",
    position: "Senior Dev",
  };

  const originalFindUnique = prisma.users?.findUnique;
  const originalUpdate = prisma.users?.update;

  let updateArgs;

  prisma.users.findUnique = async () => existingUser;
  prisma.users.update = async (args) => {
    updateArgs = args;
    return {
      UserId: userId,
      FirstName: payload.firstName,
      LastName: payload.lastName,
      Age: payload.age,
      PhoneNumber: payload.phoneNumber,
      Gender: payload.gender,
      Employee: {
        EmployeeId: 30,
        Department: payload.department,
        Position: payload.position,
      },
      Hr: null,
    };
  };

  try {
    const result = await updateUserInfo(userId, payload);

    // Verify update payload
    assert.equal(updateArgs.where.UserId, userId);
    assert.equal(updateArgs.data.FirstName, payload.firstName);
    assert.equal(updateArgs.data.LastName, payload.lastName);
    assert.equal(updateArgs.data.Age, payload.age);
    assert.equal(updateArgs.data.PhoneNumber, payload.phoneNumber);
    assert.equal(updateArgs.data.Gender, payload.gender);
    assert.ok(updateArgs.data.Employee?.update);
    assert.equal(
      updateArgs.data.Employee.update.Department,
      payload.department,
    );
    assert.equal(updateArgs.data.Employee.update.Position, payload.position);

    // Verify returned user
    assert.equal(result.UserId, userId);
    assert.equal(result.FirstName, payload.firstName);
    assert.equal(result.Employee.Department, payload.department);
    assert.equal(result.Employee.Position, payload.position);
  } finally {
    prisma.users.findUnique = originalFindUnique;
    prisma.users.update = originalUpdate;
  }
});

