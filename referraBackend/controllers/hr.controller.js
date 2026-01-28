import {
  createPosition,
  getVisiblePositions,
  updatePositionState,
  updatePositionDetails,
  //deletePosition,
  getHrDashboardStats,
  getHrPositions,
  getHrPositionDetails,
} from "../services/hr/hr.service.js";

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

/**
 * GET visible positions
 * Employee → open positions
 * HR → positions in HR departments
 */
export const GetVisiblePositions = async (req, res, next) => {
  try {
    const result = await getVisiblePositions(req.user, req.query);

    res.status(200).json({
      message: "Positions fetched successfully",
      positions: result.data,
      pagination: result.pagination,
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

export const getDashboardStatsController = async (req, res, next) => {
  try {
    const hr = req.user?.Hr;

    if (!hr) {
      const error = new Error("HR profile not found");
      error.statusCode = 403;
      throw error;
    }

    const stats = await getHrDashboardStats(hr);

    res.status(200).json(stats);
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
