-- CreateIndex
CREATE INDEX "Position_DepartmentId_idx" ON "Position"("DepartmentId");

-- CreateIndex
CREATE INDEX "Position_PositionState_idx" ON "Position"("PositionState");

-- CreateIndex
CREATE INDEX "Position_PositionTitle_idx" ON "Position"("PositionTitle");

-- CreateIndex
CREATE INDEX "Position_CreatedAt_idx" ON "Position"("CreatedAt");
