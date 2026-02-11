/*
  Warnings:

  - A unique constraint covering the columns `[DepartmentName]` on the table `Department` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Department_DepartmentName_key" ON "Department"("DepartmentName");
