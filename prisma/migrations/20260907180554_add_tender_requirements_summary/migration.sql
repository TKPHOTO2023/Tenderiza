-- AlterTable
ALTER TABLE "tenders" ADD COLUMN     "requirementsSummary" JSONB,
ADD COLUMN     "requirementsSummaryGeneratedAt" TIMESTAMP(3);
