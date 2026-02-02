import { prisma } from "../../lib/prisma.js";

// create a new position we just take all the data and if a field is missing we say all fields are required and then if everything was okay we create the position in the database
export const createPosition = async (payload, hr) => {
  const {
    positionTitle,
    companyName,
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
    !companyName ||
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
      CompanyName: companyName,
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
   (EMPLOYEE ) 
   ========================= */
export const getVisiblePositions = async (user, query) => {
  if (user.Role !== "Employee") {
    const error = new Error("Employee access only");
    error.statusCode = 403;
    throw error;
  }

  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Number(query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  const whereClause = {
    PositionState: "OPEN",
    Deadline: {
      gt: new Date(), // DO NOT show expired positions
    },
  };

  const total = await prisma.position.count({ where: whereClause });

  const positions = await prisma.position.findMany({
    where: whereClause,
    include: { Department: true },
    orderBy: { CreatedAt: "desc" },
    skip,
    take: limit,
  });

  return {
    positions: positions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
    positions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
};

// update position state (OPEN/CLOSED) toggle switch
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

  const updateData = {
    PositionState: state,
  };

  // If HR reopened the position extend deadline by 10 days from NOW
  if (position.PositionState === "CLOSED" && state === "OPEN") {
    const newDeadline = new Date();
    newDeadline.setDate(newDeadline.getDate() + 10);

    updateData.Deadline = newDeadline;
  }

  return prisma.position.update({
    where: { PositionId: positionId },
    data: updateData,
  });
};

//update position details

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

  // Ensure HR owns this position
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
    companyName,
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
      ...(companyName && { CompanyName: companyName }),
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
// get total positions , open positions, total applicants for hr dashboard stats
export const getHrDashboardStats = async (hr) => {
  if (!hr?.Departments || hr.Departments.length === 0) {
    const error = new Error("HR has no assigned departments");
    error.statusCode = 403;
    throw error;
  }

  const departmentIds = hr.Departments.map((d) => d.DepartmentId);

  const [totalPositions, openPositions, totalApplicants] =
    await prisma.$transaction([
      prisma.position.count({
        where: {
          DepartmentId: { in: departmentIds },
        },
      }),
      prisma.position.count({
        where: {
          DepartmentId: { in: departmentIds },
          PositionState: "OPEN",
        },
      }),
      prisma.application.count({
        where: {
          Position: {
            DepartmentId: { in: departmentIds },
          },
          Referral: {
            Status: {
              not: "Pending",
            },
          },
        },
      }),
    ]);

  return {
    totalPositions,
    openPositions,
    totalApplicants,
  };
};
// get positions created by hr with filters on department and status and pagination and search
export const getHrPositions = async (hr, query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Number(query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  if (!hr?.Departments || hr.Departments.length === 0) {
    const error = new Error("HR has no assigned departments");
    error.statusCode = 403;
    throw error;
  }

  const allowedDepartmentIds = hr.Departments.map((d) => d.DepartmentId);

  const { status, departmentId, search, sortBy, sortOrder } = query;

  const whereClause = {
    DepartmentId: {
      in: allowedDepartmentIds,
    },
  };

  // Filter by status
  if (status) {
    const normalizedStatus = status.toUpperCase();
    if (!["OPEN", "CLOSED"].includes(normalizedStatus)) {
      const error = new Error("Invalid position status");
      error.statusCode = 400;
      throw error;
    }
    whereClause.PositionState = normalizedStatus;
  }

  // Filter by department
  if (departmentId) {
    if (!allowedDepartmentIds.includes(departmentId)) {
      const error = new Error("Access denied to this department");
      error.statusCode = 403;
      throw error;
    }
    whereClause.DepartmentId = departmentId;
  }

  // Search by position title
  if (search && search.trim() !== "") {
    whereClause.PositionTitle = {
      contains: search.trim(),
      mode: "insensitive",
    };
  }

  //  Sorting
  let orderBy = { CreatedAt: "desc" }; // default

  const total = await prisma.position.count({
    where: whereClause,
  });

  const positions = await prisma.position.findMany({
    where: whereClause,
    include: {
      Department: true,
    },
    orderBy,
    skip,
    take: limit,
  });
  // Count NON-pending applicants per position
  const positionIds = positions.map((p) => p.PositionId);

  const applicantsCounts = await prisma.application.groupBy({
    by: ["PositionId"],
    where: {
      PositionId: { in: positionIds },
      Referral: {
        Status: {
          not: "Pending",
        },
      },
    },
    _count: true,
  });

  const countMap = Object.fromEntries(
    applicantsCounts.map((c) => [c.PositionId, c._count]),
  );

  const formattedPositions = positions.map((p) => ({
    ...p,
    applicantsCount: countMap[p.PositionId] || 0,
  }));

  return {
    positions: formattedPositions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// get detailed info about a specific position including applicants count
export const getHrPositionDetails = async (hr, positionId) => {
  if (!positionId) {
    const error = new Error("PositionId is required");
    error.statusCode = 400;
    throw error;
  }

  if (!hr?.Departments || hr.Departments.length === 0) {
    const error = new Error("HR has no assigned departments");
    error.statusCode = 403;
    throw error;
  }

  const allowedDepartmentIds = hr.Departments.map((d) => d.DepartmentId);

  const position = await prisma.position.findFirst({
    where: {
      PositionId: positionId,
      DepartmentId: {
        in: allowedDepartmentIds, //  HR ownership check
      },
    },
    include: {
      Department: true,
    },
  });

  if (!position) {
    const error = new Error("Position not found or access denied");
    error.statusCode = 404;
    throw error;
  }
  const applicantsCount = await prisma.application.count({
    where: {
      PositionId: positionId,
      Referral: {
        Status: {
          not: "Pending",
        },
      },
    },
  });

  return {
    ...position,
    applicantsCount,
  };
};

export const getDepartmentsByHr = async (hrId) => {
  if (!hrId) {
    const error = new Error("HR ID is required");
    error.statusCode = 400;
    throw error;
  }
  const departments = await prisma.hrDepartment.findMany({
    where: {
      HrId: hrId,
    },
    select: {
      Department: {
        select: {
          DepartmentId: true,
          DepartmentName: true,
        },
      },
    },
  });

  return departments.map((d) => d.Department);
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
