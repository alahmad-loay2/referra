/*
  Warnings:

  - You are about to drop the column `CVUrl` on the `Candidate` table. All the data in the column will be lost.
  - You are about to drop the column `YearOfExperience` on the `Candidate` table. All the data in the column will be lost.
  - Added the required column `CVUrl` to the `Referral` table without a default value. This is not possible if the table is not empty.
  - Added the required column `YearOfExperience` to the `Referral` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Candidate" DROP COLUMN "CVUrl",
DROP COLUMN "YearOfExperience";

-- AlterTable
ALTER TABLE "Referral" ADD COLUMN     "CVUrl" VARCHAR(512) NOT NULL,
ADD COLUMN     "YearOfExperience" INTEGER NOT NULL;
