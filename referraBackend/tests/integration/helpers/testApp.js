import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { Router } from "express";
import {
  GetVisiblePositions,
  GetPositionDetails,
  CreateReferral,
  ConfirmReferral,
  DeleteCandidate,
  getApplicationsByEmployee,
  EditCandidate,
  GetReferralDetails,
} from "../../../controllers/employee.controller.js";
import {
  CreatePosition,
  UpdatePositionState,
  UpdatePosition,
  DeletePosition,
  getHrPositionsController,
  getHrPositionDetailsController,
  getHrDepartmentsController,
  getConfirmedReferrals,
  getConfirmedReferralDetails,
  FinalizeReferral,
  AdvanceReferralStage,
  UnprospectReferral,
  getHrTeamController,
  getHrDashboardController,
  createDepartmentController,
} from "../../../controllers/hr.controller.js";
import errorMiddleware from "../../../middleware/error.middleware.js";
import { validateParams, validateBody } from "../../../middleware/validation.middleware.js";
import { paramsSchemas, candidateBodySchemas, positionBodySchemas, referralBodySchemas, departmentBodySchemas } from "../../../validation/schemas.js";
import { uploadCV } from "../../../middleware/upload.middleware.js";

/**
 * Creates a test Express app with employee routes but bypasses authentication middleware
 * The middleware is bypassed by directly attaching user data to req.user
 */
export const createTestApp = () => {
  const app = express();

  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors({ origin: "*", credentials: true }));

  // Middleware to bypass authentication and attach test user
  const bypassAuth = (req, res, next) => {
    const role = req.headers["x-test-user-role"] || "Employee";
    
    // Attach a test user to req (Employee or HR)
    // This simulates what attachUser middleware does
    req.user = {
      UserId: req.headers["x-test-user-id"] || "test-user-id",
      Email: req.headers["x-test-user-email"] || "test@example.com",
      Role: role,
      Employee: req.headers["x-test-employee-id"]
        ? {
            EmployeeId: req.headers["x-test-employee-id"],
          }
        : null,
      Hr: req.headers["x-test-hr-id"] && req.headers["x-test-hr-departments"]
        ? (() => {
            const depts = JSON.parse(req.headers["x-test-hr-departments"] || "[]");
            // Prisma structure from hrWithDepts.Departments: [{ DepartmentId: "...", Department: {...} }]
            // Services expect: hr.Departments.map((d) => d.DepartmentId)
            // Prisma HrDepartment has DepartmentId directly, so the structure is already correct
            return {
              HrId: req.headers["x-test-hr-id"],
              isAdmin: req.headers["x-test-hr-is-admin"] === "true",
              // Use departments as-is from Prisma (they already have DepartmentId)
              Departments: Array.isArray(depts) ? depts : [],
            };
          })()
        : null,
    };
    req.supabaseUserId = req.user.UserId;
    next();
  };

  // Create test routes that bypass rate limiting and other middlewares
  const testEmployeeRoutes = Router();

  // Positions routes
  testEmployeeRoutes.get(
    "/positions-employee",
    bypassAuth,
    GetVisiblePositions,
  );

  testEmployeeRoutes.get(
    "/positions-employee/:positionId",
    bypassAuth,
    validateParams(paramsSchemas.positionId),
    GetPositionDetails,
  );

  // Referral routes
  testEmployeeRoutes.post(
    "/referral",
    bypassAuth,
    uploadCV,
    validateBody(candidateBodySchemas.createReferral),
    CreateReferral,
  );

  testEmployeeRoutes.get(
    "/referral/confirm/:referralId",
    validateParams(paramsSchemas.referralId),
    ConfirmReferral,
  );

  testEmployeeRoutes.delete(
    "/referral/:referralId",
    bypassAuth,
    validateParams(paramsSchemas.referralId),
    DeleteCandidate,
  );

  testEmployeeRoutes.get(
    "/applications",
    bypassAuth,
    getApplicationsByEmployee,
  );

  testEmployeeRoutes.put(
    "/referral/:referralId",
    bypassAuth,
    uploadCV,
    validateParams(paramsSchemas.referralId),
    validateBody(candidateBodySchemas.editCandidate),
    EditCandidate,
  );

  testEmployeeRoutes.get(
    "/referrals/:referralId",
    bypassAuth,
    validateParams(paramsSchemas.referralId),
    GetReferralDetails,
  );

  // Create test HR routes
  const testHrRoutes = Router();

  // Positions routes
  testHrRoutes.post(
    "/positions",
    bypassAuth,
    validateBody(positionBodySchemas.createPosition),
    CreatePosition,
  );

  testHrRoutes.patch(
    "/positions/:positionId/state",
    bypassAuth,
    validateParams(paramsSchemas.positionId),
    validateBody(positionBodySchemas.updatePositionState),
    UpdatePositionState,
  );

  testHrRoutes.put(
    "/positions/:positionId",
    bypassAuth,
    validateParams(paramsSchemas.positionId),
    validateBody(positionBodySchemas.updatePosition),
    UpdatePosition,
  );

  testHrRoutes.get(
    "/positions-hr",
    bypassAuth,
    getHrPositionsController,
  );

  testHrRoutes.get(
    "/positions-hr/:positionId",
    bypassAuth,
    validateParams(paramsSchemas.positionId),
    getHrPositionDetailsController,
  );

  testHrRoutes.delete(
    "/positions/:positionId",
    bypassAuth,
    validateParams(paramsSchemas.positionId),
    DeletePosition,
  );

  // Referrals routes
  testHrRoutes.get(
    "/referrals",
    bypassAuth,
    getConfirmedReferrals,
  );

  testHrRoutes.get(
    "/referrals/:referralId/details",
    bypassAuth,
    validateParams(paramsSchemas.referralId),
    getConfirmedReferralDetails,
  );

  testHrRoutes.patch(
    "/referrals/:referralId/finalize",
    bypassAuth,
    validateParams(paramsSchemas.referralId),
    validateBody(referralBodySchemas.finalizeReferral),
    FinalizeReferral,
  );

  testHrRoutes.patch(
    "/referrals/:referralId/unprospect",
    bypassAuth,
    validateParams(paramsSchemas.referralId),
    UnprospectReferral,
  );

  testHrRoutes.patch(
    "/referrals/:referralId/advance",
    bypassAuth,
    validateParams(paramsSchemas.referralId),
    AdvanceReferralStage,
  );

  // Dashboard and team routes
  testHrRoutes.get(
    "/dashboard",
    bypassAuth,
    getHrDashboardController,
  );

  testHrRoutes.get(
    "/team",
    bypassAuth,
    getHrTeamController,
  );

  testHrRoutes.get(
    "/departments-hr",
    bypassAuth,
    getHrDepartmentsController,
  );

  // Admin routes - check isAdmin
  const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.Role !== "HR" || !req.user.Hr || !req.user.Hr.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    return next();
  };

  testHrRoutes.post(
    "/department",
    bypassAuth,
    requireAdmin,
    validateBody(departmentBodySchemas.createDepartment),
    createDepartmentController,
  );

  app.use("/api/employee", testEmployeeRoutes);
  app.use("/api/hr", testHrRoutes);

  app.use(errorMiddleware);

  return app;
};
