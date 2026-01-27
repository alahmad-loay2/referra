import { prisma } from "../../lib/prisma.js";

// create a new position we just take all the data and if a field is missing we say all fields are required and then if everything was okay we create the position in the database
export const createPosition = async (payload, hr) => {
  const {
    positionTitle,
    yearsRequired,
    description,
    timeZone,
    deadline,
    positionLocation,
    departmentId,
    positionState,
  } = payload;

  if (
    !positionTitle ||
    !yearsRequired ||
    !description ||
    !timeZone ||
    !deadline ||
    !positionLocation ||
    !departmentId
  ) {
    const error = new Error("Missing required fields");
    error.statusCode = 400;
    throw error;
  }

  const allowedDepartmentIds = hr.Departments.map((d) => d.DepartmentId);

  if (!allowedDepartmentIds.includes(departmentId)) {
    const error = new Error(
      "You are not allowed to create positions in this department",
    );
    error.statusCode = 403;
    throw error;
  }

  const state = positionState?.toUpperCase() || "OPEN";

  if (!["OPEN", "CLOSED"].includes(state)) {
    const error = new Error("Invalid position state");
    error.statusCode = 400;
    throw error;
  }

  return prisma.position.create({
    data: {
      PositionTitle: positionTitle,
      YearsRequired: Number(yearsRequired),
      Description: description,
      Timezone: timeZone,
      Deadline: new Date(deadline),
      PositionLocation: positionLocation,
      PositionState: state,
      DepartmentId: departmentId,
    },
  });
};

/* =========================
   GET VISIBLE POSITIONS
   (EMPLOYEE vs HR)
   ========================= */
export const getVisiblePositions = async (user, query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Number(query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  let whereClause = {};

  // EMPLOYEE → sees all OPEN positions
  if (user.Role === "Employee") {
    whereClause = {
      PositionState: "OPEN",
    };
  }

  // HR → sees positions in THEIR departments
  else if (user.Role === "HR") {
    if (!user.Hr || !user.Hr.Departments?.length) {
      const error = new Error("HR has no assigned departments");
      error.statusCode = 403;
      throw error;
    }

    const departmentIds = user.Hr.Departments.map((d) => d.DepartmentId);

    whereClause = {
      DepartmentId: {
        in: departmentIds,
      },
    };
  } else {
    const error = new Error("Unauthorized role");
    error.statusCode = 403;
    throw error;
  }

  // total count (for pagination info)
  const total = await prisma.position.count({
    where: whereClause,
  });

  const positions = await prisma.position.findMany({
    where: whereClause,
    include: {
      Department: true,
    },
    orderBy: {
      CreatedAt: "desc",
    },
    skip,
    take: limit,
  });

  return {
    data: positions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

export const updatePositionState = async (positionId, newState, hrUser) => {
  if (!positionId || !newState) {
    const error = new Error("PositionId and state are required");
    error.statusCode = 400;
    throw error;
  }

  const state = newState.toUpperCase();

  if (!["OPEN", "CLOSED"].includes(state)) {
    const error = new Error("Invalid position state");
    error.statusCode = 400;
    throw error;
  }

  if (!hrUser.Departments || !hrUser.Departments.length) {
    const error = new Error("HR has no assigned departments");
    error.statusCode = 403;
    throw error;
  }

  const allowedDepartmentIds = hrUser.Departments.map((d) => d.DepartmentId);

  const position = await prisma.position.findFirst({
    where: {
      PositionId: positionId,
      DepartmentId: {
        in: allowedDepartmentIds,
      },
    },
  });

  if (!position) {
    const error = new Error("Position not found or access denied");
    error.statusCode = 403;
    throw error;
  }

  return prisma.position.update({
    where: { PositionId: positionId },
    data: { PositionState: state },
  });
};

export const updatePositionDetails = async (positionId, payload, hr) => {
  if (!positionId) {
    const error = new Error("PositionId is required");
    error.statusCode = 400;
    throw error;
  }

  // HR departments
  if (!hr.Departments || hr.Departments.length === 0) {
    const error = new Error("HR has no assigned departments");
    error.statusCode = 403;
    throw error;
  }

  const allowedDepartmentIds = hr.Departments.map((d) => d.DepartmentId);

  // 🔒 Ensure HR owns this position
  const position = await prisma.position.findFirst({
    where: {
      PositionId: positionId,
      DepartmentId: { in: allowedDepartmentIds },
    },
  });

  if (!position) {
    const error = new Error("Position not found or access denied");
    error.statusCode = 403;
    throw error;
  }

  const {
    positionTitle,
    yearsRequired,
    description,
    timeZone,
    deadline,
    positionLocation,
    departmentId,
  } = payload;

  // Optional department change (must still belong to HR)
  if (departmentId && !allowedDepartmentIds.includes(departmentId)) {
    const error = new Error("Cannot assign position to this department");
    error.statusCode = 403;
    throw error;
  }

  return prisma.position.update({
    where: { PositionId: positionId },
    data: {
      ...(positionTitle && { PositionTitle: positionTitle }),
      ...(yearsRequired && {
        YearsRequired: Number(yearsRequired),
      }),
      ...(description && { Description: description }),
      ...(timeZone && { Timezone: timeZone }),
      ...(deadline && { Deadline: new Date(deadline) }),
      ...(positionLocation && {
        PositionLocation: positionLocation,
      }),
      ...(departmentId && { DepartmentId: departmentId }),
    },
  });
};
/*
export const deletePosition = async (positionId, hrUser) => {
  if (!positionId) {
    const error = new Error("PositionId is required");
    error.statusCode = 400;
    throw error;
  }

  if (!hrUser?.Departments?.length) {
    const error = new Error("HR has no assigned departments");
    error.statusCode = 403;
    throw error;
  }

  const allowedDepartmentIds = hrUser.Departments.map((d) => d.DepartmentId);

  //  Check ownership
  const position = await prisma.position.findFirst({
    where: {
      PositionId: positionId,
      DepartmentId: { in: allowedDepartmentIds },
    },
  });

  if (!position) {
    const error = new Error("Position not found or access denied");
    error.statusCode = 403;
    throw error;
  }

  //  Manual cascade delete
  await prisma.$transaction([
    prisma.application.deleteMany({
      where: { PositionId: positionId },
    }),
    prisma.position.delete({
      where: { PositionId: positionId },
    }),
  ]);

  return { success: true };
};*/
