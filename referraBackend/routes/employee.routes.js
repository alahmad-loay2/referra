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
import { idempotencyMiddleware } from "../middleware/idempotency.middleware.js";
import {
  validateBody,
  validateParams,
} from "../middleware/validation.middleware.js";
import { candidateBodySchemas, paramsSchemas } from "../validation/schemas.js";

const employeeRoutes = Router();

employeeRoutes.post(
  "/referral",
  generalLimiter,
  authenticate,
  requireEmployee,
  idempotencyMiddleware,
  uploadCV,
  validateBody(candidateBodySchemas.createReferral),
  CreateReferral,
);
employeeRoutes.get(
  "/referral/confirm/:referralId",
  generalLimiter,
  validateParams(paramsSchemas.referralId),
  ConfirmReferral,
);
employeeRoutes.delete(
  "/referral/:referralId",
  generalLimiter,
  authenticate,
  requireEmployee,
  validateParams(paramsSchemas.referralId),
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
  "/referral/:referralId",
  generalLimiter,
  authenticate,
  requireEmployee,
  uploadCV,
  validateParams(paramsSchemas.referralId),
  validateBody(candidateBodySchemas.editCandidate),
  EditCandidate,
);
employeeRoutes.get(
  "/referrals/:referralId",
  generalLimiter,
  authenticate,
  requireEmployee,
  validateParams(paramsSchemas.referralId),
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
  validateParams(paramsSchemas.positionId),
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
