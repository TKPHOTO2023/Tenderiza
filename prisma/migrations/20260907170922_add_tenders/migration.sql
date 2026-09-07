-- CreateEnum
CREATE TYPE "TenderStatus" AS ENUM ('PLANNED', 'OPEN', 'CLOSED', 'CANCELLED', 'UNKNOWN');

-- CreateTable
CREATE TABLE "tenders" (
    "id" TEXT NOT NULL,
    "ocid" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "buyerName" TEXT,
    "province" TEXT,
    "category" TEXT,
    "status" "TenderStatus" NOT NULL DEFAULT 'UNKNOWN',
    "publishedDate" TIMESTAMP(3),
    "closingDate" TIMESTAMP(3),
    "estimatedValue" DECIMAL(16,2),
    "currency" TEXT,
    "documentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sourceUrl" TEXT,
    "rawData" JSONB NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tender_sync_logs" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "releasesFetched" INTEGER NOT NULL DEFAULT 0,
    "tendersCreated" INTEGER NOT NULL DEFAULT 0,
    "tendersUpdated" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "errorMessage" TEXT,

    CONSTRAINT "tender_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenders_ocid_key" ON "tenders"("ocid");

-- CreateIndex
CREATE INDEX "tenders_status_closingDate_idx" ON "tenders"("status", "closingDate");

-- CreateIndex
CREATE INDEX "tenders_province_idx" ON "tenders"("province");
