import { Router } from "express";
import {
  GetUserInfo,
  UpdateUserInfo,
  UpdateProfilePicture,
} from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { generalLimiter } from "../middleware/rateLimit.middleware.js";
import { uploadProfileImage } from "../middleware/upload.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { userBodySchemas } from "../validation/schemas.js";

const userRoutes = Router();

// Get current user information
userRoutes.get("/me", generalLimiter, authenticate, GetUserInfo);

// Update current user information
userRoutes.put(
  "/me",
  generalLimiter,
  authenticate,
  validateBody(userBodySchemas.updateUser),
  UpdateUserInfo,
);

// Update current user profile picture
userRoutes.put(
  "/me/profile-picture",
  generalLimiter,
  authenticate,
  uploadProfileImage,
  UpdateProfilePicture,
);

export default userRoutes;
