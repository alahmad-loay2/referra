/*
  Warnings:

  - The `PositionState` column on the `Position` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PositionState" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "Position" DROP COLUMN "PositionState",
ADD COLUMN     "PositionState" "PositionState" NOT NULL DEFAULT 'OPEN';
