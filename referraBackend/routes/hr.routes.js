import { Router } from "express";
import {
  CreatePosition,
  GetVisiblePositions,
  UpdatePositionState,
  UpdatePosition,
  getConfirmedReferrals,
  FinalizeReferral,
  AdvanceReferralStage,
  getConfirmedReferralDetails,
  // DeletePosition,
  getDashboardStatsController,
  getHrPositionsController,
  getHrPositionDetailsController,
  getHrDepartmentsController,
  getHrTeamController,
} from "../controllers/hr.controller.js";
import { authenticate, requireHr } from "../middleware/auth.middleware.js";
import { generalLimiter } from "../middleware/rateLimit.middleware.js";
// later we will add auth + HR middleware here
const router = Router();

// CREATE position (HR only)
router.post(
  "/positions",
  generalLimiter,
  authenticate,
  requireHr,
  CreatePosition,
);
// GET visible positions (for Employee)
router.get(
  "/positions-employee",
  generalLimiter,
  authenticate,
  GetVisiblePositions,
);
// update position state for toggle =
router.patch(
  "/positions/:positionId/state",
  generalLimiter,
  authenticate,
  requireHr,
  UpdatePositionState,
);
// UPDATE position details
router.put(
  "/positions/:positionId",
  generalLimiter,
  authenticate,
  requireHr,
  UpdatePosition,
);
// HR dashboard stats
router.get(
  "/dashboard-stats",
  authenticate,
  requireHr,
  getDashboardStatsController,
);

router.get("/positions-hr", authenticate, requireHr, getHrPositionsController);

router.get(
  "/positions-hr/:positionId",
  authenticate,
  requireHr,
  getHrPositionDetailsController,
);

//  DELETE POSITION
/*router.delete(
  "/positions/:positionId",
  generalLimiter,
  authenticate,
  requireHr,
  DeletePosition,
);*/

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
  getConfirmedReferralDetails,
);
router.patch(
  "/referrals/:referralId/finalize",
  generalLimiter,
  authenticate,
  requireHr,
  FinalizeReferral,
);

router.patch(
  "/referrals/:referralId/advance",
  generalLimiter,
  authenticate,
  requireHr,
  AdvanceReferralStage,
);

router.get(
  "/departments-hr",
  authenticate,
  requireHr,
  getHrDepartmentsController,
);

router.get(
  "/team",
  authenticate,
  requireHr,
  getHrTeamController,
);

export default router;
