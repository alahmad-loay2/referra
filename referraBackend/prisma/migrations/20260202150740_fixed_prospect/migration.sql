-- AlterEnum
ALTER TYPE "Status" ADD VALUE 'Hired';

-- AlterTable
ALTER TABLE "Referral" ADD COLUMN     "Prospect" BOOLEAN NOT NULL DEFAULT false;
