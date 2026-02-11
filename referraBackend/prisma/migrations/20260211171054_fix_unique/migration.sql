/*
  Warnings:

  - A unique constraint covering the columns `[Key,UserId]` on the table `IdempotencyKey` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "IdempotencyKey_Key_key";

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_Key_UserId_key" ON "IdempotencyKey"("Key", "UserId");
