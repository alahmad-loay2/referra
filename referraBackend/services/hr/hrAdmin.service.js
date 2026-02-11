import { prisma } from "../../lib/prisma.js";


export const createDepartment = async (name) => {
    const existing = await prisma.department.findUnique({
        where: { DepartmentName: name },
    });
    if (existing) {
        const error = new Error("Department with this name already exists");
        error.statusCode = 400;
        throw error;
    }
    return await prisma.department.create({
        data: { DepartmentName: name },
    });
}