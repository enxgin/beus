-- AlterTable
ALTER TABLE "CashRegisterLog" ADD COLUMN     "referenceId" TEXT,
ADD COLUMN     "referenceType" TEXT;

-- CreateIndex
CREATE INDEX "CashRegisterLog_branchId_createdAt_idx" ON "CashRegisterLog"("branchId", "createdAt");

-- CreateIndex
CREATE INDEX "CashRegisterLog_referenceId_referenceType_idx" ON "CashRegisterLog"("referenceId", "referenceType");
