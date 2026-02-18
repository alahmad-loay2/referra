/*
  Warnings:

  - You are about to alter the column `Description` on the `Position` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(3000)`.

*/
-- AlterTable
ALTER TABLE "Position" ALTER COLUMN "Description" SET DATA TYPE VARCHAR(3000);
