import { Router } from "express";
import {
  CreateReferral,
  ConfirmReferral,
  DeleteCandidate,
  getApplicationsByEmployee,
  EditCandidate,
  GetReferralDetails,
  GetVisiblePositions,
  GetPositionDetails,
  CheckCandidateByEmail,
  GetEmployeeDashboard,
} from "../controllers/employee.controller.js";
import {
  authenticate,
  requireEmployee,
} from "../middleware/auth.middleware.js";
import { uploadCV } from "../middleware/upload.middleware.js";
import { generalLimiter } from "../middleware/rateLimit.middleware.js";

const employeeRoutes = Router();

employeeRoutes.post(
  "/referral",
  generalLimiter,
  authenticate,
  requireEmployee,
  uploadCV,
  CreateReferral,
);
employeeRoutes.get(
  "/referral/confirm/:referralId",
  generalLimiter,
  ConfirmReferral,
);
employeeRoutes.delete(
  "/referral/:referralId",
  generalLimiter,
  authenticate,
  requireEmployee,
  DeleteCandidate,
);
employeeRoutes.get(
  "/applications",
  generalLimiter,
  authenticate,
  requireEmployee,
  getApplicationsByEmployee,
);
employeeRoutes.put(
  "/candidate/:candidateId",
  generalLimiter,
  authenticate,
  requireEmployee,
  uploadCV,
  EditCandidate,
);
employeeRoutes.get(
  "/referrals/:referralId",
  generalLimiter,
  authenticate,
  requireEmployee,
  GetReferralDetails,
);

employeeRoutes.get(
  "/positions-employee",
  generalLimiter,
  authenticate,
  requireEmployee,
  GetVisiblePositions,
);

employeeRoutes.get(
  "/positions-employee/:positionId",
  generalLimiter,
  authenticate,
  requireEmployee,
  GetPositionDetails,
);

employeeRoutes.get(
  "/candidate/by-email",
  generalLimiter,
  authenticate,
  requireEmployee,
  CheckCandidateByEmail,
);

employeeRoutes.get(
  "/dashboard",
  generalLimiter,
  authenticate,
  requireEmployee,
  GetEmployeeDashboard,
);

export default employeeRoutes;
