/*
  Warnings:

  - You are about to drop the column `referenceId` on the `CashRegisterLog` table. All the data in the column will be lost.
  - You are about to drop the column `referenceType` on the `CashRegisterLog` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CashMovementCategory" AS ENUM ('RENT', 'UTILITIES', 'SUPPLIES', 'STAFF_ADVANCE', 'MAINTENANCE', 'MARKETING', 'OTHER_EXPENSE', 'OTHER_INCOME');

-- DropIndex
DROP INDEX "CashRegisterLog_referenceId_referenceType_idx";

-- AlterTable
ALTER TABLE "CashRegisterLog" DROP COLUMN "referenceId",
DROP COLUMN "referenceType",
ADD COLUMN     "category" "CashMovementCategory";
