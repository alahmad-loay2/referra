/*
  Warnings:

  - Added the required column `EmploymentType` to the `Position` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY');

-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "EmploymentType" "EmploymentType" NOT NULL;
