-- DropIndex
DROP INDEX "Position_CreatedAt_idx";

-- DropIndex
DROP INDEX "Referral_CreatedAt_idx";

-- CreateIndex
CREATE INDEX "Position_CreatedAt_idx" ON "Position"("CreatedAt" DESC);

-- CreateIndex
CREATE INDEX "Referral_CreatedAt_idx" ON "Referral"("CreatedAt" DESC);
