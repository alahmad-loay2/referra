import { Router } from "express";
import {
  CreateReferral,
  ConfirmReferral,
  DeleteCandidate,
  getApplicationsByEmployee,
  EditCandidate,
  GetReferralDetails,
} from "../controllers/employee.controller.js";
import {
  authenticate,
  requireEmployee,
} from "../middleware/auth.middleware.js";
import { uploadCV } from "../middleware/upload.middleware.js";

const employeeRoutes = Router();

employeeRoutes.post(
  "/referral",
  authenticate,
  requireEmployee,
  uploadCV,
  CreateReferral,
);
employeeRoutes.get("/referral/confirm/:referralId", ConfirmReferral);
employeeRoutes.delete(
  "/referral/:referralId",
  authenticate,
  requireEmployee,
  DeleteCandidate,
);
employeeRoutes.get(
  "/applications",
  authenticate,
  requireEmployee,
  getApplicationsByEmployee,
);
employeeRoutes.put(
  "/candidate/:candidateId",
  authenticate,
  requireEmployee,
  uploadCV,
  EditCandidate,
);
employeeRoutes.get(
  "/referrals/:referralId",
  authenticate,
  requireEmployee,
  GetReferralDetails,
);

export default employeeRoutes;
