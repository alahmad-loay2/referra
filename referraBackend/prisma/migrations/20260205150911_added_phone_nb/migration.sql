/*
  Warnings:

  - Added the required column `PhoneNumber` to the `Candidate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "PhoneNumber" TEXT NOT NULL;
