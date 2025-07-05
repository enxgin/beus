/*
  Warnings:

  - Added the required column `updatedAt` to the `Package` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('SESSION', 'TIME');

-- DropIndex
DROP INDEX "ServiceCategory_name_key";

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "branchId" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "totalMinutes" INTEGER,
ADD COLUMN     "totalSessions" INTEGER,
ADD COLUMN     "type" "PackageType" NOT NULL DEFAULT 'SESSION',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ServiceCategory" ADD COLUMN     "branchId" TEXT;

-- AddForeignKey
ALTER TABLE "ServiceCategory" ADD CONSTRAINT "ServiceCategory_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
