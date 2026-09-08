-- CreateEnum
CREATE TYPE "DraftStatus" AS ENUM ('GENERATED', 'EDITED', 'FINALIZED');

-- CreateTable
CREATE TABLE "drafts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tenderId" TEXT NOT NULL,
    "documentUrls" JSONB NOT NULL DEFAULT '[]',
    "complianceChecklist" JSONB NOT NULL DEFAULT '[]',
    "status" "DraftStatus" NOT NULL DEFAULT 'GENERATED',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drafts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "drafts_companyId_tenderId_key" ON "drafts"("companyId", "tenderId");

-- AddForeignKey
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drafts" ADD CONSTRAINT "drafts_tenderId_fkey" FOREIGN KEY ("tenderId") REFERENCES "tenders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
