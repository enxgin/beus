/*
  Warnings:

  - You are about to drop the column `maxCapacity` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `serviceType` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Service` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Service" DROP COLUMN "maxCapacity",
DROP COLUMN "serviceType",
DROP COLUMN "type";

-- DropEnum
DROP TYPE "ServiceType";
