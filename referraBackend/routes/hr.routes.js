import { Router } from "express";
import {
  CreatePosition,
  UpdatePositionState,
  UpdatePosition,
  getConfirmedReferrals,
  FinalizeReferral,
  AdvanceReferralStage,
  getConfirmedReferralDetails,
  DeletePosition,
  getHrPositionsController,
  getHrPositionDetailsController,
  getHrDepartmentsController,
  getHrTeamController,
  getHrDashboardController,
  UnprospectReferral,
  createDepartmentController,
} from "../controllers/hr.controller.js";
import { authenticate, requireAdmin, requireHr } from "../middleware/auth.middleware.js";
import { generalLimiter } from "../middleware/rateLimit.middleware.js";
import { idempotencyMiddleware } from "../middleware/idempotency.middleware.js";
import { validateBody, validateParams } from "../middleware/validation.middleware.js";
import { positionBodySchemas, paramsSchemas, referralBodySchemas, departmentBodySchemas } from "../validation/schemas.js";
// later we will add auth + HR middleware here
const router = Router();

// CREATE position (HR only)
router.post(
  "/positions",
  generalLimiter,
  authenticate,
  requireHr,
  idempotencyMiddleware,
  validateBody(positionBodySchemas.createPosition),
  CreatePosition,
);


// update position state for toggle =
router.patch(
  "/positions/:positionId/state",
  generalLimiter,
  authenticate,
  requireHr,
  validateParams(paramsSchemas.positionId),
  validateBody(positionBodySchemas.updatePositionState),
  UpdatePositionState,
);
// UPDATE position details
router.put(
  "/positions/:positionId",
  generalLimiter,
  authenticate,
  requireHr,
  validateParams(paramsSchemas.positionId),
  validateBody(positionBodySchemas.updatePosition),
  UpdatePosition,
);
router.get("/positions-hr", authenticate, requireHr, getHrPositionsController);

router.get(
  "/positions-hr/:positionId",
  authenticate,
  requireHr,
  validateParams(paramsSchemas.positionId),
  getHrPositionDetailsController,
);

//  DELETE POSITION
router.delete(
  "/positions/:positionId",
  generalLimiter,
  authenticate,
  requireHr,
  validateParams(paramsSchemas.positionId),
  DeletePosition,
);

router.get(
  "/referrals",
  generalLimiter,
  authenticate,
  requireHr,
  getConfirmedReferrals,
);

router.get(
  "/referrals/:referralId/details",
  generalLimiter,
  authenticate,
  requireHr,
  validateParams(paramsSchemas.referralId),
  getConfirmedReferralDetails,
);
router.patch(
  "/referrals/:referralId/finalize",
  generalLimiter,
  authenticate,
  requireHr,
  validateParams(paramsSchemas.referralId),
  validateBody(referralBodySchemas.finalizeReferral),
  FinalizeReferral,
);

router.patch(
  "/referrals/:referralId/unprospect",
  generalLimiter,
  authenticate,
  requireHr,
  validateParams(paramsSchemas.referralId),
  UnprospectReferral,
);

router.patch(
  "/referrals/:referralId/advance",
  generalLimiter,
  authenticate,
  requireHr,
  validateParams(paramsSchemas.referralId),
  AdvanceReferralStage,
);

router.get(
  "/departments-hr",
  generalLimiter,
  authenticate,
  requireHr,
  getHrDepartmentsController,
);

router.get(
  "/team",
  generalLimiter,
  authenticate,
  requireHr,
  getHrTeamController,
);

router.get(
  "/dashboard",
  generalLimiter,
  authenticate,
  requireHr,
  getHrDashboardController,
);

router.post("/department", generalLimiter, authenticate, requireAdmin, idempotencyMiddleware, validateBody(departmentBodySchemas.createDepartment), createDepartmentController)

export default router;
