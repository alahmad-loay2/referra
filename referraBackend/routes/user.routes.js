import { Router } from "express";
import { GetUserInfo, UpdateUserInfo } from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { generalLimiter } from "../middleware/rateLimit.middleware.js";

const userRoutes = Router();

// Get current user information
userRoutes.get(
  "/me",
  generalLimiter,
  authenticate,
  GetUserInfo,
);

// Update current user information
userRoutes.put(
  "/me",
  generalLimiter,
  authenticate,
  UpdateUserInfo,
);

export default userRoutes;
