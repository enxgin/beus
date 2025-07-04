-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "type" "ServiceType" NOT NULL DEFAULT 'TIME_BASED',
ALTER COLUMN "duration" DROP NOT NULL;
