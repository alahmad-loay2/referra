import { Router } from "express";
import { signup, signin, verifyEmail, logout, forgotPasswordController, resetPasswordController, bootstrapFirstHrController, createHrController } from "../controllers/auth.controller.js";
import { authenticate, requireHr } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { userBodySchemas } from "../validation/schemas.js";

const authRoutes = Router();

// Auth routes without idempotency for simplicity on auth flows
authRoutes.post("/signup", authLimiter, validateBody(userBodySchemas.signup), signup);
authRoutes.post("/signin", authLimiter, validateBody(userBodySchemas.signin), signin);
authRoutes.post("/verify-email", authLimiter, validateBody(userBodySchemas.verifyEmail), verifyEmail);
// Logout should always execute immediately
authRoutes.post("/logout", authenticate, logout);
authRoutes.post("/forgot-password", authLimiter, validateBody(userBodySchemas.forgotPassword), forgotPasswordController);
authRoutes.post("/reset-password", authLimiter, validateBody(userBodySchemas.resetPassword), resetPasswordController);

authRoutes.post("/bootstrap-first-hr", authLimiter, validateBody(userBodySchemas.bootstrapFirstHr), bootstrapFirstHrController);

authRoutes.post("/hr/create", authLimiter, authenticate, requireHr, validateBody(userBodySchemas.createHr), createHrController);

// this is to test authentication only
authRoutes.get("/me", authenticate, (req, res) => {
  res.status(200).json({
    message: "You are authenticated!",
    user: req.user,
  });
});

export default authRoutes;