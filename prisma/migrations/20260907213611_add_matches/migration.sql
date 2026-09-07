-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('ELIGIBLE', 'PARTIAL', 'NOT_ELIGIBLE', 'NEEDS_REVIEW');

-- AlterTable
ALTER TABLE "tenders" ADD COLUMN     "extractedRequirements" JSONB,
ADD COLUMN     "requirementsExtractedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "categoryMatch" BOOLEAN NOT NULL,
    "provinceMatch" BOOLEAN NOT NULL,
    "hardChecks" JSONB NOT NULL DEFAULT '[]',
    "status" "MatchStatus" NOT NULL,
    "reasons" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "computedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "matches_companyId_status_idx" ON "matches"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "matches_companyId_tenderId_key" ON "matches"("companyId", "tenderId");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
