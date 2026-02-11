import { Router } from "express";
import { signup, signin, verifyEmail, logout, forgotPasswordController, resetPasswordController, bootstrapFirstHrController, createHrController } from "../controllers/auth.controller.js";
import { authenticate, requireHr } from "../middleware/auth.middleware.js";
import { authLimiter } from "../middleware/rateLimit.middleware.js";
import { idempotencyMiddleware } from "../middleware/idempotency.middleware.js";
import { validateBody } from "../middleware/validation.middleware.js";
import { userBodySchemas } from "../validation/schemas.js";

const authRoutes = Router();

authRoutes.post("/signup", authLimiter, idempotencyMiddleware, validateBody(userBodySchemas.signup), signup);
authRoutes.post("/signin", authLimiter, idempotencyMiddleware, validateBody(userBodySchemas.signin), signin);
authRoutes.post("/verify-email", authLimiter, idempotencyMiddleware, validateBody(userBodySchemas.verifyEmail), verifyEmail);
authRoutes.post("/logout", authenticate, idempotencyMiddleware, logout);
authRoutes.post("/forgot-password", authLimiter, idempotencyMiddleware, validateBody(userBodySchemas.forgotPassword), forgotPasswordController);
authRoutes.post("/reset-password", authLimiter, idempotencyMiddleware, validateBody(userBodySchemas.resetPassword), resetPasswordController);

authRoutes.post("/bootstrap-first-hr", authLimiter, idempotencyMiddleware, validateBody(userBodySchemas.bootstrapFirstHr), bootstrapFirstHrController);

authRoutes.post("/hr/create", authLimiter, authenticate, requireHr, idempotencyMiddleware, validateBody(userBodySchemas.createHr), createHrController);

// this is to test authentication only
authRoutes.get("/me", authenticate, (req, res) => {
  res.status(200).json({
    message: "You are authenticated!",
    user: req.user,
  });
});

export default authRoutes;