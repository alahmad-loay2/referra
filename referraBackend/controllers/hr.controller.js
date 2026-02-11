import {
  createPosition,
  updatePositionState,
  updatePositionDetails,
  //deletePosition,
  getHrPositions,
  getHrPositionDetails,
  getDepartmentsByHr,
} from "../services/hr/hrPositions.service.js";
import {
  advanceReferralStage,
  finalizeReferral,
  getAllConfirmedReferrals,
  getReferralDetails,
  unprospectReferral,
} from "../services/hr/hrReferrals.service.js";
import { getHrTeam } from "../services/hr/hrTeam.service.js";
import { getHrDashboard } from "../services/hr/hrDashboard.service.js";
import { createDepartment } from "../services/hr/hrAdmin.service.js";

/**
 * HR – Create Position
 */
export const CreatePosition = async (req, res, next) => {
  try {
    const hr = req.user?.Hr;

    if (!hr) {
      const error = new Error("HR profile not found");
      error.statusCode = 403;
      throw error;
    }

    const position = await createPosition(req.body, hr);

    res.status(201).json({
      message: "Position created successfully",
      position,
    });
  } catch (error) {
    next(error);
  }
};

export const UpdatePositionState = async (req, res, next) => {
  try {
    const hr = req.user?.Hr;
    if (!hr) {
      const error = new Error("HR profile not found");
      error.statusCode = 403;
      throw error;
    }

    if (!req.body) {
      const error = new Error("Request body is required");
      error.statusCode = 400;
      throw error;
    }

    const { state } = req.body;
    const { positionId } = req.params;

    if (!state) {
      const error = new Error("State is required");
      error.statusCode = 400;
      throw error;
    }

    const position = await updatePositionState(positionId, state, hr);

    res.status(200).json({
      message: "Position state updated successfully",
      position,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * HR – Update position details
 */
export const UpdatePosition = async (req, res, next) => {
  try {
    const hr = req.user?.Hr;
    if (!hr) {
      const error = new Error("HR profile not found");
      error.statusCode = 403;
      throw error;
    }

    const { positionId } = req.params;

    const position = await updatePositionDetails(positionId, req.body, hr);

    res.status(200).json({
      message: "Position updated successfully",
      position,
    });
  } catch (error) {
    next(error);
  }
};

export const getHrPositionsController = async (req, res, next) => {
  try {
    const hr = req.user.Hr;

    const result = await getHrPositions(hr, req.query);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getHrPositionDetailsController = async (req, res, next) => {
  try {
    const hr = req.user?.Hr;
    if (!hr) {
      const error = new Error("HR profile not found");
      error.statusCode = 403;
      throw error;
    }

    const { positionId } = req.params;

    const position = await getHrPositionDetails(hr, positionId);

    res.status(200).json(position);
  } catch (error) {
    next(error);
  }
};

export const getHrDepartmentsController = async (req, res, next) => {
  try {
    const hrId = req.user.Hr?.HrId;

    if (!hrId) {
      const error = new Error("HR profile not found");
      error.statusCode = 404;
      throw error;
    }

    const departments = await getDepartmentsByHr(hrId);
    res.status(200).json(departments);
  } catch (error) {
    next(error);
  }
};

export const getHrTeamController = async (req, res, next) => {
  try {
    const result = await getHrTeam(req.query);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
/*export const DeletePosition = async (req, res, next) => {
  try {
    const hr = req.user?.Hr;

    if (!hr) {
      const error = new Error("HR profile not found");
      error.statusCode = 403;
      throw error;
    }

    const { positionId } = req.params;

    const result = await deletePosition(positionId, hr);

    res.status(200).json({
      message: "Position deleted successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
*/

export const getConfirmedReferrals = async (req, res, next) => {
  try {
    const hrId = req.user?.Hr.HrId;
    if (!hrId) {
      return res.status(403).json({ message: "HR access only" });
    }
    const { page = "1", pageSize = "10", search, status, createdAt, createdAfter, positionId } = req.query;
    const referrals = await getAllConfirmedReferrals({ hrId, page: parseInt(page, 10), pageSize: parseInt(pageSize, 10) ,search, status, createdAt, createdAfter, positionId });

    res.status(200).json(referrals);
  } catch (err) {
    next(err);
  }
};

export const getConfirmedReferralDetails = async (req, res, next) => {
  try {
    const hrId = req.user?.Hr.HrId;
    if (!hrId) {
      return res.status(403).json({ message: "HR access only" });
    }

    const { referralId } = req.params;

    const details = await getReferralDetails({ referralId, hrId });

    res.status(200).json(details);
  } catch (err) {
    next(err);
  }
};

export const AdvanceReferralStage = async (req, res, next) => {
  try {
    const hr = req.user?.Hr;
    if (!hr) {
      const error = new Error("HR profile not found");
      error.statusCode = 403;
      throw error;
    }

    const { referralId } = req.params;

    if (!referralId) {
      const error = new Error("Referral ID is required");
      error.statusCode = 400;
      throw error;
    }

    const updatedReferral = await advanceReferralStage(referralId, hr);

    res.status(200).json({
      message: "Referral advanced to next stage successfully",
      referral: updatedReferral,
    });
  } catch (err) {
    next(err);
  }
};

export const FinalizeReferral = async (req, res, next) => {
  try {
    const hr = req.user?.Hr;
    if (!hr) {
      const error = new Error("HR profile not found");
      error.statusCode = 403;
      throw error;
    }

    const { referralId } = req.params;
    const { action, compensation } = req.body;

    if (!referralId || !action) {
      const error = new Error("Referral ID and action are required");
      error.statusCode = 400;
      throw error;
    }

    const candidate = await finalizeReferral(
      referralId,
      action,
      hr,
      compensation,
    );

    res.status(200).json({
      message: `Referral ${action} completed successfully`,
      candidate,
    });
  } catch (err) {
    next(err);
  }
};

export const UnprospectReferral = async (req, res, next) => {
  try {
    const hr = req.user?.Hr;
    if (!hr) {
      const error = new Error("HR profile not found");
      error.statusCode = 403;
      throw error;
    }

    const { referralId } = req.params;

    if (!referralId) {
      const error = new Error("Referral ID is required");
      error.statusCode = 400;
      throw error;
    }

    const candidate = await unprospectReferral(referralId, hr);

    res.status(200).json({
      message: "Referral unprospected successfully",
      candidate,
    });
  } catch (err) {
    next(err);
  }
};

export const getHrDashboardController = async (req, res, next) => {
  try {
    const hr = req.user?.Hr;

    if (!hr) {
      const error = new Error("HR profile not found");
      error.statusCode = 403;
      throw error;
    }

    const dashboard = await getHrDashboard(hr);

    res.status(200).json(dashboard);
  } catch (error) {
    next(error);
  }
};


export const createDepartmentController = async (req, res, next) => {
  try {
    const hr = req.user?.Hr;
    if (!hr) {
      const error = new Error("HR profile not found");
      error.statusCode = 403;
      throw error;
    }
    const { name } = req.body;
    const department = await createDepartment(name);
    res.status(201).json(department);
  } catch (error) {
    next(error);
  }
}