import { getUserInfo, updateUserInfo, updateProfilePicture } from "../services/user/user.service.js";
import { clearUserCache } from "../middleware/auth.middleware.js";

/**
 * Get current authenticated user information
 * Returns user data with role-specific details (HR/Employee)
 */
export const GetUserInfo = async (req, res, next) => {
  try {
    const userId = req.user?.UserId;

    if (!userId) {
      const error = new Error("User not authenticated");
      error.statusCode = 401;
      throw error;
    }

    const user = await getUserInfo(userId);

    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

/**
 * Update current authenticated user information
 * Allows updating: firstName, lastName, age, phoneNumber, gender
 * For Employees: also allows updating department and position
 */
export const UpdateUserInfo = async (req, res, next) => {
  try {
    const userId = req.user?.UserId;

    if (!userId) {
      const error = new Error("User not authenticated");
      error.statusCode = 401;
      throw error;
    }

    // Clear cache BEFORE updating (so we fetch fresh data)
    clearUserCache(userId);

    const updatedUser = await updateUserInfo(userId, req.body);

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

/**
 * Update current authenticated user's profile picture
 * Accepts image file upload
 */
export const UpdateProfilePicture = async (req, res, next) => {
  try {
    const userId = req.user?.UserId;

    if (!userId) {
      const error = new Error("User not authenticated");
      error.statusCode = 401;
      throw error;
    }

    if (!req.file) {
      const error = new Error("Profile image file is required");
      error.statusCode = 400;
      throw error;
    }

    // Clear cache BEFORE updating (so we fetch fresh data)
    clearUserCache(userId);

    const accessToken = req.cookies?.accessToken || null;
    const updatedUser = await updateProfilePicture(userId, req.file, accessToken);

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};
