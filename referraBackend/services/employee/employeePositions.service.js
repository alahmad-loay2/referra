import { prisma } from "../../lib/prisma.js";


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
      gt: new Date(),
    },
  };

  // Run count and findMany in parallel for faster response
  const [total, positions] = await Promise.all([
    prisma.position.count({ where: whereClause }),
    prisma.position.findMany({
      where: whereClause,
      include: { Department: true },
      orderBy: { CreatedAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return {
    positions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
};

export const getPositionDetails = async (user, positionId) => {
  if (user.Role !== "Employee") {
    const error = new Error("Employee access only");
    error.statusCode = 403;
    throw error;
  }

  if (!positionId) {
    const error = new Error("PositionId is required");
    error.statusCode = 400;
    throw error;
  }

  const position = await prisma.position.findUnique({
    where: {
      PositionId: positionId,
    },
    include: {
      Department: true,
    },
  });

  if (!position) {
    const error = new Error("Position not found");
    error.statusCode = 404;
    throw error;
  }

  if (position.PositionState !== "OPEN" || position.Deadline <= new Date()) {
    const error = new Error("Position not available");
    error.statusCode = 404;
    throw error;
  }

  return position;
};