-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "TotalCompensation" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "Compensation" (
    "CompensationId" TEXT NOT NULL,
    "HrId" TEXT NOT NULL,
    "EmployeeId" TEXT NOT NULL,
    "Amount" INTEGER NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Compensation_pkey" PRIMARY KEY ("CompensationId")
);

-- AddForeignKey
ALTER TABLE "Compensation" ADD CONSTRAINT "Compensation_HrId_fkey" FOREIGN KEY ("HrId") REFERENCES "Hr"("HrId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compensation" ADD CONSTRAINT "Compensation_EmployeeId_fkey" FOREIGN KEY ("EmployeeId") REFERENCES "Employee"("EmployeeId") ON DELETE RESTRICT ON UPDATE CASCADE;
