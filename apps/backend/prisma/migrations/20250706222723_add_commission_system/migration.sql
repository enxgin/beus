/*
  Warnings:

  - Added the required column `maxCapacity` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceType` to the `Service` table without a default value. This is not possible if the table is not empty.
  - Made the column `duration` on table `Service` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `StaffCommission` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'APPROVED', 'PAID', 'CANCELED');

-- AlterTable
-- Önce mevcut kayıtları düzeltelim
UPDATE "Service" SET "duration" = 60 WHERE "duration" IS NULL;

-- Sonra alanları ekleyelim
ALTER TABLE "Service" 
ADD COLUMN "description" TEXT,
ADD COLUMN "maxCapacity" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "serviceType" "ServiceType" NOT NULL DEFAULT 'TIME_BASED',
ADD COLUMN "unitCount" INTEGER,
ALTER COLUMN "duration" SET NOT NULL,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- Varsayılan değerleri kaldır (gelecekteki girişler için)
ALTER TABLE "Service" ALTER COLUMN "maxCapacity" DROP DEFAULT,
ALTER COLUMN "serviceType" DROP DEFAULT;

-- AlterTable
ALTER TABLE "StaffCommission" ADD COLUMN     "appliedRuleId" TEXT,
ADD COLUMN     "serviceId" TEXT,
ADD COLUMN     "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "CommissionRule" (
    "id" TEXT NOT NULL,
    "type" "CommissionType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "serviceId" TEXT,
    "userId" TEXT,

    CONSTRAINT "CommissionRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommissionRule_userId_serviceId_isGlobal_idx" ON "CommissionRule"("userId", "serviceId", "isGlobal");

-- CreateIndex
CREATE INDEX "StaffCommission_staffId_serviceId_status_idx" ON "StaffCommission"("staffId", "serviceId", "status");

-- AddForeignKey
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionRule" ADD CONSTRAINT "CommissionRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffCommission" ADD CONSTRAINT "StaffCommission_appliedRuleId_fkey" FOREIGN KEY ("appliedRuleId") REFERENCES "CommissionRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffCommission" ADD CONSTRAINT "StaffCommission_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
