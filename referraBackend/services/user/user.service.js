import { prisma } from "../../lib/prisma.js";

/**
 * Get user information with role-specific details
 * For HR: includes HR details and departments
 * For Employee: includes Employee details
 */
export const getUserInfo = async (userId) => {
  if (!userId) {
    const error = new Error("UserId is required");
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.users.findUnique({
    where: { UserId: userId },
    include: {
      Employee: true,
      Hr: {
        include: {
          Departments: {
            include: {
              Department: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return user;
};

/**
 * Update user information
 * Editable fields: FirstName, LastName, Age, PhoneNumber, Gender
 * For Employee: also allows updating Department and Position
 */
export const updateUserInfo = async (userId, payload) => {
  if (!userId) {
    const error = new Error("UserId is required");
    error.statusCode = 400;
    throw error;
  }

  const { firstName, lastName, age, phoneNumber, gender, department, position } =
    payload;

  // Validate that at least one field is provided
  if (
    !firstName &&
    !lastName &&
    age === undefined &&
    !phoneNumber &&
    !gender &&
    !department &&
    !position
  ) {
    const error = new Error("At least one field is required to update");
    error.statusCode = 400;
    throw error;
  }

  // Check if user exists
  const existingUser = await prisma.users.findUnique({
    where: { UserId: userId },
    include: { Employee: true, Hr: true },
  });

  if (!existingUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // Build update data for Users table
  const userUpdateData = {};
  if (firstName) userUpdateData.FirstName = firstName;
  if (lastName) userUpdateData.LastName = lastName;
  if (age !== undefined) userUpdateData.Age = parseInt(age);
  if (phoneNumber) userUpdateData.PhoneNumber = phoneNumber;
  if (gender) userUpdateData.Gender = gender;

  // Update user and related data
  const updatedUser = await prisma.users.update({
    where: { UserId: userId },
    data: {
      ...userUpdateData,
      // If user is Employee and department/position provided, update Employee table
      ...(existingUser.Role === "Employee" &&
        existingUser.Employee &&
        (department || position)
        ? {
            Employee: {
              update: {
                ...(department && { Department: department }),
                ...(position && { Position: position }),
              },
            },
          }
        : {}),
    },
    include: {
      Employee: true,
      Hr: {
        include: {
          Departments: {
            include: {
              Department: true,
            },
          },
        },
      },
    },
  });

  return updatedUser;
};
