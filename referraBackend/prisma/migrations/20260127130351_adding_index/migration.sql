-- CreateIndex
CREATE INDEX "Candidate_FirstName_idx" ON "Candidate"("FirstName");

-- CreateIndex
CREATE INDEX "Candidate_LastName_idx" ON "Candidate"("LastName");

-- CreateIndex
CREATE INDEX "Referral_Status_idx" ON "Referral"("Status");

-- CreateIndex
CREATE INDEX "Referral_CreatedAt_idx" ON "Referral"("CreatedAt");
