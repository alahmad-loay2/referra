import { Router } from "express";
import { CreateReferral, ConfirmReferral, DeleteCandidate } from "../controllers/employee.controller.js";
import { authenticate, requireEmployee } from "../middleware/auth.middleware.js";
import { uploadCV } from "../middleware/upload.middleware.js";

const employeeRoutes = Router();

employeeRoutes.post("/referral", authenticate, requireEmployee, uploadCV, CreateReferral);
employeeRoutes.get("/referral/confirm/:referralId", ConfirmReferral);
employeeRoutes.delete("/candidate/:candidateId", authenticate, requireEmployee, DeleteCandidate);

export default employeeRoutes;
