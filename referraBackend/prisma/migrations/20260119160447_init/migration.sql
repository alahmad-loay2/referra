-- CreateEnum
CREATE TYPE "Role" AS ENUM ('HR', 'Employee');

-- CreateTable
CREATE TABLE "Users" (
    "UserId" TEXT NOT NULL,
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "Age" INTEGER NOT NULL,
    "PhoneNumber" TEXT NOT NULL,
    "Gender" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "Password" TEXT NOT NULL,
    "Role" "Role" NOT NULL DEFAULT 'Employee',
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("UserId")
);

-- CreateTable
CREATE TABLE "Employee" (
    "EmployeeId" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,
    "Department" TEXT NOT NULL,
    "TotalCompensation" INTEGER NOT NULL,
    "Position" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("EmployeeId")
);

-- CreateTable
CREATE TABLE "Hr" (
    "HrId" TEXT NOT NULL,
    "UserId" TEXT NOT NULL,

    CONSTRAINT "Hr_pkey" PRIMARY KEY ("HrId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_Email_key" ON "Users"("Email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_UserId_key" ON "Employee"("UserId");

-- CreateIndex
CREATE UNIQUE INDEX "Hr_UserId_key" ON "Hr"("UserId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("UserId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hr" ADD CONSTRAINT "Hr_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("UserId") ON DELETE RESTRICT ON UPDATE CASCADE;
