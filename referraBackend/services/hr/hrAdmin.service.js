import { prisma } from "../../lib/prisma.js";


export const createDepartment = async (name) => {
    // Note: If DepartmentName has a unique constraint in the database,
    // the create will fail with a unique constraint violation if it exists,
    // which is the safest approach. However, we check first for better error messages.
    return await prisma.$transaction(async (tx) => {
        const existing = await tx.department.findUnique({
            where: { DepartmentName: name },
        });
        if (existing) {
            const error = new Error("Department with this name already exists");
            error.statusCode = 400;
            throw error;
        }
        
        const department = await tx.department.create({
            data: { DepartmentName: name },
        });
        
        // Automatically add all admin HR users to the new department
        const adminHrs = await tx.hr.findMany({
            where: { isAdmin: true },
            select: { HrId: true },
        });
        
        if (adminHrs.length > 0) {
            await tx.hrDepartment.createMany({
                data: adminHrs.map((hr) => ({
                    HrId: hr.HrId,
                    DepartmentId: department.DepartmentId,
                })),
                skipDuplicates: true, // In case admin is already in the department (shouldn't happen, but safe)
            });
        }
        
        return department;
    });
}