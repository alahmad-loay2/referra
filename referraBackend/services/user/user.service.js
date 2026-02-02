import { prisma } from "../../lib/prisma.js";
import { supabase } from "../../lib/supabase.js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../../config/env.js";
import { createClient } from "@supabase/supabase-js";

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

/**
 * Update user profile picture
 * Uploads image to Supabase storage and updates user's ProfileUrl
 */
export const updateProfilePicture = async (userId, profileImageFile, accessToken = null) => {
  if (!userId) {
    const error = new Error("UserId is required");
    error.statusCode = 400;
    throw error;
  }

  if (!profileImageFile) {
    const error = new Error("Profile image file is required");
    error.statusCode = 400;
    throw error;
  }

  // Check if user exists
  const existingUser = await prisma.users.findUnique({
    where: { UserId: userId },
  });

  if (!existingUser) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  // Delete old profile picture if it exists
  if (existingUser.ProfileUrl) {
    try {
      // Extract filename from ProfileUrl (format: ${SUPABASE_URL}/storage/v1/object/public/profile/${fileName})
      // Handle both full URL and relative path formats
      let fileName = existingUser.ProfileUrl;
      
      // If it's a full URL, extract just the filename
      if (existingUser.ProfileUrl.includes("/profile/")) {
        const urlParts = existingUser.ProfileUrl.split("/profile/");
        if (urlParts.length === 2) {
          fileName = urlParts[1];
        }
      } else if (existingUser.ProfileUrl.includes("/")) {
        // If it's a path, get the last part (filename)
        fileName = existingUser.ProfileUrl.split("/").pop();
      }
      
      // Remove any query parameters if present
      fileName = fileName.split("?")[0];
      
      // Create authenticated Supabase client with access token
      // This is needed to satisfy the RLS policy that requires authentication
      const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: {
          headers: accessToken ? {
            Authorization: `Bearer ${accessToken}`,
          } : {},
        },
      });
      
      const { data, error: deleteError } = await supabaseClient.storage
        .from("profile")
        .remove([fileName]);

      if (deleteError) {
        console.error(`Failed to delete old profile picture from Supabase:`, {
          fileName,
          error: deleteError.message,
          errorDetails: deleteError
        });
        // Continue with upload even if deletion fails
      }
    } catch (error) {
      console.error(`Error deleting old profile picture from Supabase:`, {
        profileUrl: existingUser.ProfileUrl,
        error: error.message,
        stack: error.stack
      });
      // Continue with upload even if deletion fails
    }
  }

  // Upload new profile picture to Supabase
  const fileExt = profileImageFile.originalname.split(".").pop() || "jpg";
  const fileName = `${userId}-${Date.now()}.${fileExt}`;

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("profile")
    .upload(fileName, profileImageFile.buffer, {
      contentType: profileImageFile.mimetype,
      upsert: false,
    });

  if (uploadError) {
    const error = new Error(`Profile picture upload failed: ${uploadError.message}`);
    error.statusCode = 500;
    throw error;
  }

  const profileUrl = `${SUPABASE_URL}/storage/v1/object/public/profile/${fileName}`;

  // Update user's profile URL
  const updatedUser = await prisma.users.update({
    where: { UserId: userId },
    data: {
      ProfileUrl: profileUrl,
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
