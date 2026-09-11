-- CreateEnum
CREATE TYPE "ProcurementType" AS ENUM ('RFQ', 'RFP', 'RFI', 'UNKNOWN');

-- AlterTable
ALTER TABLE "tenders" ADD COLUMN     "pricingSchedule" JSONB,
ADD COLUMN     "procurementType" "ProcurementType" NOT NULL DEFAULT 'UNKNOWN';

