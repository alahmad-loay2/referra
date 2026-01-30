import { prisma } from "../../lib/prisma.js";


// Get all HR members with their user data and departments
// Returns total HR members count and total departments count
 
export const getHrTeam = async (query) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Number(query.limit) || 10, 50);
  const skip = (page - 1) * limit;

  const { search, departmentId } = query;

  const whereClause = {};

  if (search && search.trim() !== "") {
    whereClause.User = {
      OR: [
        { FirstName: { contains: search.trim(), mode: "insensitive" } },
        { LastName: { contains: search.trim(), mode: "insensitive" } },
        { Email: { contains: search.trim(), mode: "insensitive" } },
      ],
    };
  }

  if (departmentId) {
    whereClause.Departments = {
      some: {
        DepartmentId: departmentId,
      },
    };
  }

  const totalHrMembers = await prisma.hr.count({
    where: whereClause,
  });

  const totalDepartments = await prisma.department.count();

  const hrMembers = await prisma.hr.findMany({
    where: whereClause,
    include: {
      User: true,
      Departments: {
        include: { Department: true },
      },
    },
    orderBy: {
      User: { CreatedAt: "desc" },
    },
    skip,
    take: limit,
  });

  const formattedHrMembers = hrMembers.map((hr) => ({
    ...hr,
    departments: hr.Departments.map((hrDept) => hrDept.Department),
  }));

  return {
    hrMembers: formattedHrMembers,
    pagination: {
      page,
      limit,
      total: totalHrMembers,
      totalPages: Math.ceil(totalHrMembers / limit),
      hasNextPage: page * limit < totalHrMembers,
      hasPrevPage: page > 1,
    },
  };
};


