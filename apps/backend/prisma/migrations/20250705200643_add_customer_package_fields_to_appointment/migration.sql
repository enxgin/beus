-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "customerPackageId" TEXT,
ADD COLUMN     "packageServiceId" TEXT;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_customerPackageId_fkey" FOREIGN KEY ("customerPackageId") REFERENCES "CustomerPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
