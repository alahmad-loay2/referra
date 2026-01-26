/*
  Warnings:

  - Added the required column `DepartmentId` to the `Hr` table without a default value. This is not possible if the table is not empty.
  - Added the required column `DepartmentId` to the `Position` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Hr" ADD COLUMN     "DepartmentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "DepartmentId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Department" (
    "DepartmentId" TEXT NOT NULL,
    "DepartmentName" TEXT NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("DepartmentId")
);

-- AddForeignKey
ALTER TABLE "Hr" ADD CONSTRAINT "Hr_DepartmentId_fkey" FOREIGN KEY ("DepartmentId") REFERENCES "Department"("DepartmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_DepartmentId_fkey" FOREIGN KEY ("DepartmentId") REFERENCES "Department"("DepartmentId") ON DELETE RESTRICT ON UPDATE CASCADE;
