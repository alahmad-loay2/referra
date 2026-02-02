/*
  Warnings:

  - Added the required column `CompanyName` to the `Position` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "CompanyName" TEXT NOT NULL;
