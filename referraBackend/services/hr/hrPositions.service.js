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
    employmentType,
  } = payload;

  if (
    !positionTitle ||
    !companyName ||
    !yearsRequired ||
    !description ||
    !timeZone ||
    !deadline ||
    !positionLocation ||
    !departmentId ||
    !employmentType
  ) {
    const error = new Error("Missing required fields");
    error.statusCode = 400;
    throw error;
  }

  // Length validations (aligned with prisma schema)
  if (positionTitle.length > 100) {
    const error = new Error("Position title must be at most 100 characters");
    error.statusCode = 400;
    throw error;
  }

  if (companyName.length > 100) {
    const error = new Error("Company name must be at most 100 characters");
    error.statusCode = 400;
    throw error;
  }

  if (positionLocation.length > 100) {
    const error = new Error("Position location must be at most 100 characters");
    error.statusCode = 400;
    throw error;
  }

  if (timeZone.length > 64) {
    const error = new Error("Timezone must be at most 64 characters");
    error.statusCode = 400;
    throw error;
  }
  const normalizedEmploymentType = employmentType.toUpperCase();

  const allowedEmploymentTypes = [
    "FULL_TIME",
    "PART_TIME",
    "CONTRACT",
    "INTERNSHIP",
    "TEMPORARY",
  ];

  if (!allowedEmploymentTypes.includes(normalizedEmploymentType)) {
    const error = new Error("Invalid employment type");
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
      EmploymentType: normalizedEmploymentType,
      DepartmentId: departmentId,
    },
  });
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

  // Use transaction to update position and referrals atomically
  return await prisma.$transaction(async (tx) => {
    // Update position state
    const updatedPosition = await tx.position.update({
      where: { PositionId: positionId },
      data: updateData,
    });

    // If closing position: mark all referrals that aren't hired and aren't accepted in other position as prospects
    if (position.PositionState === "OPEN" && state === "CLOSED") {
      // Find all applications for this position
      const applications = await tx.application.findMany({
        where: {
          PositionId: positionId,
        },
        include: {
          Referral: true,
        },
      });

      // Mark referrals as prospects if they meet criteria
      for (const app of applications) {
        const referral = app.Referral;
        // Only mark as prospect if not Hired and not AcceptedInOtherPosition
        if (
          referral.Status !== "Hired" &&
          !referral.AcceptedInOtherPosition
        ) {
          await tx.referral.update({
            where: { ReferralId: referral.ReferralId },
            data: { Prospect: true },
          });
        }
      }
    }

    // If opening position: unmark prospects that were marked due to position closure
    if (position.PositionState === "CLOSED" && state === "OPEN") {
      // Find all applications for this position
      const applications = await tx.application.findMany({
        where: {
          PositionId: positionId,
        },
        include: {
          Referral: true,
        },
      });

      // Unmark prospects for this position
      for (const app of applications) {
        if (app.Referral && app.Referral.Prospect) {
          await tx.referral.update({
            where: { ReferralId: app.Referral.ReferralId },
            data: { Prospect: false },
          });
        }
      }
    }

    return updatedPosition;
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
    employmentType,
  } = payload;

  // Length validations for provided fields
  if (positionTitle && positionTitle.length > 100) {
    const error = new Error("Position title must be at most 100 characters");
    error.statusCode = 400;
    throw error;
  }

  if (companyName && companyName.length > 100) {
    const error = new Error("Company name must be at most 100 characters");
    error.statusCode = 400;
    throw error;
  }

  if (positionLocation && positionLocation.length > 100) {
    const error = new Error("Position location must be at most 100 characters");
    error.statusCode = 400;
    throw error;
  }

  if (timeZone && timeZone.length > 64) {
    const error = new Error("Timezone must be at most 64 characters");
    error.statusCode = 400;
    throw error;
  }

  // Optional department change (must still belong to HR)
  if (departmentId && !allowedDepartmentIds.includes(departmentId)) {
    const error = new Error("Cannot assign position to this department");
    error.statusCode = 403;
    throw error;
  }
  const allowedEmploymentTypes = [
    "FULL_TIME",
    "PART_TIME",
    "CONTRACT",
    "INTERNSHIP",
    "TEMPORARY",
  ];

  if (employmentType) {
    const normalizedEmploymentType = employmentType.toUpperCase();

    if (!allowedEmploymentTypes.includes(normalizedEmploymentType)) {
      const error = new Error("Invalid employment type");
      error.statusCode = 400;
      throw error;
    }
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
      ...(employmentType && {
        EmploymentType: employmentType.toUpperCase(),
      }),
    },
  });
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

  // Run all queries in parallel for maximum performance
  const [total, positions, totalPositions, openPositions, totalApplicants] = await Promise.all([
    prisma.position.count({
      where: whereClause,
    }),
    prisma.position.findMany({
      where: whereClause,
      include: {
        Department: true,
      },
      orderBy,
      skip,
      take: limit,
    }),
    // Stats: total positions
    prisma.position.count({
      where: {
        DepartmentId: { in: allowedDepartmentIds },
      },
    }),
    // Stats: open positions
    prisma.position.count({
      where: {
        DepartmentId: { in: allowedDepartmentIds },
        PositionState: "OPEN",
      },
    }),
    // Stats: total applicants
    prisma.application.count({
      where: {
        Position: {
          DepartmentId: { in: allowedDepartmentIds },
        },
        Referral: {
          Status: {
            not: "Pending",
          },
        },
      },
    }),
  ]);
  
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
    stats: {
      totalPositions,
      openPositions,
      totalApplicants,
    },
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

  // Run position fetch and applicants count in parallel
  const [position, applicantsCount] = await Promise.all([
    prisma.position.findFirst({
      where: {
        PositionId: positionId,
        DepartmentId: {
          in: allowedDepartmentIds, //  HR ownership check
        },
      },
      include: {
        Department: true,
      },
    }),
    prisma.application.count({
      where: {
        PositionId: positionId,
        Referral: {
          Status: {
            not: "Pending",
          },
        },
      },
    }),
  ]);

  if (!position) {
    const error = new Error("Position not found or access denied");
    error.statusCode = 404;
    throw error;
  }

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
    include: {
      Department: true,
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
