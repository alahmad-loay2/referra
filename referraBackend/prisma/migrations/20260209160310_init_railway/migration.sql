/*
  Warnings:

  - You are about to alter the column `FirstName` on the `Candidate` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `LastName` on the `Candidate` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `Email` on the `Candidate` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `CVUrl` on the `Candidate` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(512)`.
  - You are about to alter the column `PhoneNumber` on the `Candidate` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - You are about to alter the column `DepartmentName` on the `Department` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `PositionTitle` on the `Position` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `Timezone` on the `Position` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(64)`.
  - You are about to alter the column `PositionLocation` on the `Position` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `CompanyName` on the `Position` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `FirstName` on the `Users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `LastName` on the `Users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `PhoneNumber` on the `Users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - You are about to alter the column `Gender` on the `Users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - You are about to alter the column `Email` on the `Users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `ProfileUrl` on the `Users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(512)`.

*/
-- AlterTable
ALTER TABLE "Candidate" ALTER COLUMN "FirstName" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "LastName" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "Email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "CVUrl" SET DATA TYPE VARCHAR(512),
ALTER COLUMN "PhoneNumber" SET DATA TYPE VARCHAR(32);

-- AlterTable
ALTER TABLE "Department" ALTER COLUMN "DepartmentName" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "Position" ALTER COLUMN "PositionTitle" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "Timezone" SET DATA TYPE VARCHAR(64),
ALTER COLUMN "PositionLocation" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "CompanyName" SET DATA TYPE VARCHAR(100);

-- AlterTable
ALTER TABLE "Users" ALTER COLUMN "FirstName" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "LastName" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "PhoneNumber" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "Gender" SET DATA TYPE VARCHAR(32),
ALTER COLUMN "Email" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "ProfileUrl" SET DATA TYPE VARCHAR(512);
