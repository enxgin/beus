/*
  Warnings:

  - You are about to drop the column `branchId` on the `ServiceCategory` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `ServiceCategory` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ServiceCategory" DROP CONSTRAINT "ServiceCategory_branchId_fkey";

-- AlterTable
ALTER TABLE "ServiceCategory" DROP COLUMN "branchId",
DROP COLUMN "isActive";
