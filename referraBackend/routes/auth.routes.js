import { Router } from "express";
import { signup, signin, verifyEmail, logout, forgotPasswordController, resetPasswordController, bootstrapFirstHrController, createHrController } from "../controllers/auth.controller.js";
import { authenticate, requireHr } from "../middleware/auth.middleware.js";

const authRoutes = Router();

authRoutes.post("/signup", signup);
authRoutes.post("/signin", signin);
authRoutes.post("/verify-email", verifyEmail);
authRoutes.post("/logout", authenticate, logout);
authRoutes.post("/forgot-password", forgotPasswordController);
authRoutes.post("/reset-password", resetPasswordController);

authRoutes.post("/bootstrap-first-hr", bootstrapFirstHrController);

authRoutes.post("/hr/create", authenticate, requireHr, createHrController);

authRoutes.get("/me", authenticate, (req, res) => {
  res.status(200).json({
    message: "You are authenticated!",
    user: req.user,
  });
});

export default authRoutes;