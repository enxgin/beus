/*
  Warnings:

  - You are about to drop the `_CommissionRuleToUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "CommissionRuleType" AS ENUM ('GENERAL', 'SERVICE_SPECIFIC', 'STAFF_SPECIFIC');

-- DropForeignKey
ALTER TABLE "_CommissionRuleToUser" DROP CONSTRAINT "_CommissionRuleToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_CommissionRuleToUser" DROP CONSTRAINT "_CommissionRuleToUser_B_fkey";

-- AlterTable
ALTER TABLE "CommissionRule" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "ruleType" "CommissionRuleType" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "serviceId" TEXT,
ADD COLUMN     "staffId" TEXT,
ALTER COLUMN "rate" SET DEFAULT 0,
ALTER COLUMN "fixedAmount" SET DEFAULT 0,
ALTER COLUMN "startDate" SET DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "_CommissionRuleToUser";

-- CreateIndex
CREATE INDEX "CommissionRule_ruleType_branchId_isActive_idx" ON "CommissionRule"("ruleType", "branchId", "isActive");

-- CreateIndex
CREATE INDEX "CommissionRule_serviceId_isActive_idx" ON "CommissionRule"("serviceId", "isActive");

-- CreateIndex
CREATE INDEX "CommissionRule_staffId_isActive_idx" ON "CommissionRule"("staffId", "isActive");

-- AddForeignKey
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
