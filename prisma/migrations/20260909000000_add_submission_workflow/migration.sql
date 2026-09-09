-- CreateEnum
CREATE TYPE "SubmissionMethod" AS ENUM ('MANUAL', 'ELECTRONIC');

-- AlterEnum
-- Phase 5 replaces the Phase 4 GENERATED/EDITED/FINALIZED lifecycle with an
-- explicit review-and-submission gate. Any existing rows are mapped
-- conservatively rather than cast directly: FINALIZED ("user says it's
-- ready") is NOT auto-promoted to APPROVED, since approval now requires an
-- explicit pricing confirmation that a pre-Phase-5 row never captured.
BEGIN;
CREATE TYPE "DraftStatus_new" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'SUBMITTED', 'NOT_SUBMITTING');
ALTER TABLE "drafts" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "drafts" ALTER COLUMN "status" TYPE "DraftStatus_new" USING (
  CASE "status"::text
    WHEN 'GENERATED' THEN 'DRAFT'
    WHEN 'EDITED' THEN 'DRAFT'
    WHEN 'FINALIZED' THEN 'UNDER_REVIEW'
    ELSE "status"::text
  END::"DraftStatus_new"
);
ALTER TYPE "DraftStatus" RENAME TO "DraftStatus_old";
ALTER TYPE "DraftStatus_new" RENAME TO "DraftStatus";
DROP TYPE "DraftStatus_old";
ALTER TABLE "drafts" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterTable
ALTER TABLE "drafts" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "briefingAttended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notSubmittingReason" TEXT,
ADD COLUMN     "pricingConfirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pricingConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "pricingNotes" TEXT,
ADD COLUMN     "reviewStartedAt" TIMESTAMP(3),
ADD COLUMN     "submissionMethod" "SubmissionMethod",
ADD COLUMN     "submissionNotes" TEXT,
ADD COLUMN     "submittedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "draft_status_logs" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "fromStatus" "DraftStatus",
    "toStatus" "DraftStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draft_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "draft_status_logs_draftId_createdAt_idx" ON "draft_status_logs"("draftId", "createdAt");

-- AddForeignKey
ALTER TABLE "draft_status_logs" ADD CONSTRAINT "draft_status_logs_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
