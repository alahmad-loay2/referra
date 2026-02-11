-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "IdempotencyKeyId" TEXT NOT NULL,
    "Key" VARCHAR(255) NOT NULL,
    "UserId" TEXT,
    "Method" VARCHAR(10) NOT NULL,
    "Path" VARCHAR(512) NOT NULL,
    "RequestHash" VARCHAR(64),
    "ResponseStatus" INTEGER NOT NULL,
    "ResponseBody" JSONB NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ExpiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("IdempotencyKeyId")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_Key_key" ON "IdempotencyKey"("Key");

-- CreateIndex
CREATE INDEX "IdempotencyKey_Key_idx" ON "IdempotencyKey"("Key");

-- CreateIndex
CREATE INDEX "IdempotencyKey_UserId_idx" ON "IdempotencyKey"("UserId");

-- CreateIndex
CREATE INDEX "IdempotencyKey_ExpiresAt_idx" ON "IdempotencyKey"("ExpiresAt");

-- AddForeignKey
ALTER TABLE "IdempotencyKey" ADD CONSTRAINT "IdempotencyKey_UserId_fkey" FOREIGN KEY ("UserId") REFERENCES "Users"("UserId") ON DELETE SET NULL ON UPDATE CASCADE;
