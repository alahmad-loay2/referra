import { Router } from "express";
import { signup, signin, verifyEmail, logout, forgotPasswordController, resetPasswordController, bootstrapFirstHrController, createHrController } from "../controllers/auth.controller.js";
import { authenticate, requireHr } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";

const authRoutes = Router();

authRoutes.post("/signup", authLimiter, signup);
authRoutes.post("/signin", authLimiter, signin);
authRoutes.post("/verify-email", authLimiter, verifyEmail);
authRoutes.post("/logout", authenticate, logout);
authRoutes.post("/forgot-password", authLimiter, forgotPasswordController);
authRoutes.post("/reset-password", authLimiter, resetPasswordController);

authRoutes.post("/bootstrap-first-hr", authLimiter, bootstrapFirstHrController);

authRoutes.post("/hr/create", authLimiter, authenticate, requireHr, createHrController);

// this is to test authentication only
authRoutes.get("/me", authenticate, (req, res) => {
  res.status(200).json({
    message: "You are authenticated!",
    user: req.user,
  });
});

export default authRoutes;