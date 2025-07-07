/*
  Warnings:

  - You are about to drop the `CashRegisterLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "CashDayStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterEnum
ALTER TYPE "CashLogType" ADD VALUE 'INVOICE_PAYMENT';

-- DropForeignKey
ALTER TABLE "CashRegisterLog" DROP CONSTRAINT "CashRegisterLog_branchId_fkey";

-- DropForeignKey
ALTER TABLE "CashRegisterLog" DROP CONSTRAINT "CashRegisterLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_cashRegisterLogId_fkey";

-- DropTable
DROP TABLE "CashRegisterLog";

-- CreateTable
CREATE TABLE "cash_register_days" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "CashDayStatus" NOT NULL DEFAULT 'OPEN',
    "openingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expectedBalance" DOUBLE PRECISION,
    "actualBalance" DOUBLE PRECISION,
    "difference" DOUBLE PRECISION,
    "openedBy" TEXT NOT NULL,
    "closedBy" TEXT,
    "branchId" TEXT NOT NULL,
    "notes" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "cash_register_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_register_logs" (
    "id" TEXT NOT NULL,
    "type" "CashLogType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "branchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "dayId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_register_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cash_register_days_date_branchId_status_idx" ON "cash_register_days"("date", "branchId", "status");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_cashRegisterLogId_fkey" FOREIGN KEY ("cashRegisterLogId") REFERENCES "cash_register_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_register_days" ADD CONSTRAINT "cash_register_days_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_register_days" ADD CONSTRAINT "cash_register_days_openedBy_fkey" FOREIGN KEY ("openedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_register_days" ADD CONSTRAINT "cash_register_days_closedBy_fkey" FOREIGN KEY ("closedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_register_logs" ADD CONSTRAINT "cash_register_logs_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_register_logs" ADD CONSTRAINT "cash_register_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_register_logs" ADD CONSTRAINT "cash_register_logs_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "cash_register_days"("id") ON DELETE SET NULL ON UPDATE CASCADE;
