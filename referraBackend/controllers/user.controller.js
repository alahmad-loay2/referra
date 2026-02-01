import { getUserInfo, updateUserInfo } from "../services/user/user.service.js";

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

    const updatedUser = await updateUserInfo(userId, req.body);

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};
