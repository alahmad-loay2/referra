/*
  Warnings:

  - You are about to drop the column `DepartmentId` on the `Hr` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Hr" DROP CONSTRAINT "Hr_DepartmentId_fkey";

-- AlterTable
ALTER TABLE "Hr" DROP COLUMN "DepartmentId";

-- CreateTable
CREATE TABLE "HrDepartment" (
    "HrId" TEXT NOT NULL,
    "DepartmentId" TEXT NOT NULL,

    CONSTRAINT "HrDepartment_pkey" PRIMARY KEY ("HrId","DepartmentId")
);

-- AddForeignKey
ALTER TABLE "HrDepartment" ADD CONSTRAINT "HrDepartment_HrId_fkey" FOREIGN KEY ("HrId") REFERENCES "Hr"("HrId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HrDepartment" ADD CONSTRAINT "HrDepartment_DepartmentId_fkey" FOREIGN KEY ("DepartmentId") REFERENCES "Department"("DepartmentId") ON DELETE RESTRICT ON UPDATE CASCADE;
