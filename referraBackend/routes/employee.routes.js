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

export default employeeRoutes;
