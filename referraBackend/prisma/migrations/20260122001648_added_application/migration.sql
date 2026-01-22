-- CreateEnum
CREATE TYPE "Status" AS ENUM ('Pending', 'Confirmed', 'InterviewOne', 'InterviewTwo', 'Acceptance');

-- CreateTable
CREATE TABLE "Application" (
    "ReferralId" TEXT NOT NULL,
    "EmployeeId" TEXT NOT NULL,
    "CandidateId" TEXT NOT NULL,
    "PositionId" TEXT NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("EmployeeId","CandidateId","PositionId")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "CandidateId" TEXT NOT NULL,
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "YearOfExperience" INTEGER NOT NULL,
    "Acceptance" BOOLEAN NOT NULL DEFAULT false,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("CandidateId")
);

-- CreateTable
CREATE TABLE "Referral" (
    "ReferralId" TEXT NOT NULL,
    "Status" "Status" NOT NULL DEFAULT 'Pending',
    "AcceptedInOtherPosition" BOOLEAN NOT NULL DEFAULT false,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("ReferralId")
);

-- CreateTable
CREATE TABLE "Position" (
    "PositionId" TEXT NOT NULL,
    "PositionTitle" TEXT NOT NULL,
    "PositionState" TEXT NOT NULL,
    "YearsRequired" INTEGER NOT NULL,
    "Description" TEXT NOT NULL,
    "Timezone" TEXT NOT NULL,
    "Deadline" TIMESTAMP(3) NOT NULL,
    "PositionLocation" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("PositionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Application_ReferralId_key" ON "Application"("ReferralId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_Email_key" ON "Candidate"("Email");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_ReferralId_fkey" FOREIGN KEY ("ReferralId") REFERENCES "Referral"("ReferralId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_EmployeeId_fkey" FOREIGN KEY ("EmployeeId") REFERENCES "Employee"("EmployeeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_CandidateId_fkey" FOREIGN KEY ("CandidateId") REFERENCES "Candidate"("CandidateId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_PositionId_fkey" FOREIGN KEY ("PositionId") REFERENCES "Position"("PositionId") ON DELETE RESTRICT ON UPDATE CASCADE;
