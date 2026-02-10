-- CreateIndex
CREATE INDEX "Application_EmployeeId_idx" ON "Application"("EmployeeId");

-- CreateIndex
CREATE INDEX "Application_CandidateId_idx" ON "Application"("CandidateId");

-- CreateIndex
CREATE INDEX "Application_PositionId_idx" ON "Application"("PositionId");

-- CreateIndex
CREATE INDEX "Application_ReferralId_idx" ON "Application"("ReferralId");

-- CreateIndex
CREATE INDEX "Application_EmployeeId_ReferralId_idx" ON "Application"("EmployeeId", "ReferralId");

-- CreateIndex
CREATE INDEX "Compensation_HrId_idx" ON "Compensation"("HrId");

-- CreateIndex
CREATE INDEX "Compensation_EmployeeId_idx" ON "Compensation"("EmployeeId");

-- CreateIndex
CREATE INDEX "Department_DepartmentName_idx" ON "Department"("DepartmentName");

-- CreateIndex
CREATE INDEX "HrDepartment_DepartmentId_idx" ON "HrDepartment"("DepartmentId");
