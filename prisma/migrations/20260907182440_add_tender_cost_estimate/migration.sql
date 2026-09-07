-- AlterTable
ALTER TABLE "tenders" ADD COLUMN     "costEstimate" JSONB,
ADD COLUMN     "costEstimateGeneratedAt" TIMESTAMP(3);
