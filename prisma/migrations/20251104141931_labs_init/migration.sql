-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('LOCAL', 'S3', 'GCS');

-- CreateEnum
CREATE TYPE "LabReportStatus" AS ENUM ('PENDING', 'OCR_PROCESSING', 'OCR_FAILED', 'PARSED', 'READY');

-- CreateEnum
CREATE TYPE "BiomarkerCategory" AS ENUM ('CBC', 'METABOLIC', 'LIPIDS', 'RENAL', 'LIVER', 'THYROID', 'HORMONE', 'VITAMINS', 'INFLAMMATION', 'OTHER');

-- CreateEnum
CREATE TYPE "MeasurementComparator" AS ENUM ('LT', 'LTE', 'EQ', 'GTE', 'GT', 'APPROX');

-- CreateEnum
CREATE TYPE "MeasurementFlag" AS ENUM ('LOW', 'HIGH', 'NORMAL', 'CRITICAL_LOW', 'CRITICAL_HIGH', 'ABNORMAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MeasurementSource" AS ENUM ('OCR', 'MANUAL', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "OcrJobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('PENDING', 'RUNNING', 'FAILED', 'DONE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'PASSWORD_CHANGE', 'LAB_REPORT_UPLOAD', 'LAB_REPORT_DELETE', 'LAB_REPORT_VIEW', 'MEASUREMENT_CREATE', 'MEASUREMENT_UPDATE', 'MEASUREMENT_DELETE', 'AI_ANALYSIS_RUN', 'SHARE_LINK_CREATE', 'SHARE_LINK_REVOKE');

-- CreateTable
CREATE TABLE "StorageObject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "StorageProvider" NOT NULL DEFAULT 'LOCAL',
    "bucket" TEXT,
    "key" TEXT NOT NULL,
    "url" TEXT,
    "mimeType" TEXT,
    "size" INTEGER,
    "sha256" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "pageCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "providerName" TEXT,
    "accessionNumber" TEXT,
    "orderId" TEXT,
    "collectedAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3),
    "status" "LabReportStatus" NOT NULL DEFAULT 'PENDING',
    "sourceFileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "LabReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OcrJob" (
    "id" TEXT NOT NULL,
    "labReportId" TEXT NOT NULL,
    "engine" TEXT,
    "status" "OcrJobStatus" NOT NULL DEFAULT 'QUEUED',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "textLength" INTEGER,
    "confidenceAvg" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OcrJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabReportOcr" (
    "id" TEXT NOT NULL,
    "labReportId" TEXT NOT NULL,
    "engine" TEXT,
    "confidenceAvg" DOUBLE PRECISION,
    "pageCount" INTEGER,
    "rawText" TEXT NOT NULL,
    "blocksJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabReportOcr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Biomarker" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "BiomarkerCategory" NOT NULL DEFAULT 'OTHER',
    "canonicalUnit" TEXT NOT NULL,
    "defaultRefLow" DECIMAL(20,10),
    "defaultRefHigh" DECIMAL(20,10),
    "maleRefLow" DECIMAL(20,10),
    "maleRefHigh" DECIMAL(20,10),
    "femaleRefLow" DECIMAL(20,10),
    "femaleRefHigh" DECIMAL(20,10),
    "description" TEXT,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Biomarker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Measurement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "biomarkerId" TEXT NOT NULL,
    "labReportId" TEXT,
    "measuredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "value" DECIMAL(30,12),
    "inCanonicalUnit" DECIMAL(30,12),
    "comparator" "MeasurementComparator" NOT NULL DEFAULT 'EQ',
    "rawValueText" TEXT,
    "unit" TEXT NOT NULL,
    "referenceLow" DECIMAL(30,12),
    "referenceHigh" DECIMAL(30,12),
    "referenceText" TEXT,
    "flag" "MeasurementFlag" NOT NULL DEFAULT 'UNKNOWN',
    "source" "MeasurementSource" NOT NULL DEFAULT 'OCR',
    "ocrConfidence" DOUBLE PRECISION,
    "provenanceFileId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportAnalysis" (
    "id" TEXT NOT NULL,
    "labReportId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'PENDING',
    "model" TEXT,
    "promptVersion" TEXT,
    "summaryMarkdown" TEXT,
    "findings" JSONB,
    "riskTags" TEXT[],
    "tokensPrompt" INTEGER,
    "tokensCompletion" INTEGER,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "subjectType" TEXT,
    "subjectId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StorageObject_userId_createdAt_idx" ON "StorageObject"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "StorageObject_provider_bucket_key_idx" ON "StorageObject"("provider", "bucket", "key");

-- CreateIndex
CREATE INDEX "LabReport_userId_createdAt_idx" ON "LabReport"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "LabReport_status_createdAt_idx" ON "LabReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OcrJob_labReportId_createdAt_idx" ON "OcrJob"("labReportId", "createdAt");

-- CreateIndex
CREATE INDEX "OcrJob_status_createdAt_idx" ON "OcrJob"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LabReportOcr_labReportId_key" ON "LabReportOcr"("labReportId");

-- CreateIndex
CREATE UNIQUE INDEX "Biomarker_slug_key" ON "Biomarker"("slug");

-- CreateIndex
CREATE INDEX "Biomarker_category_name_idx" ON "Biomarker"("category", "name");

-- CreateIndex
CREATE INDEX "Measurement_userId_measuredAt_idx" ON "Measurement"("userId", "measuredAt");

-- CreateIndex
CREATE INDEX "Measurement_biomarkerId_measuredAt_idx" ON "Measurement"("biomarkerId", "measuredAt");

-- CreateIndex
CREATE INDEX "Measurement_labReportId_idx" ON "Measurement"("labReportId");

-- CreateIndex
CREATE INDEX "ReportAnalysis_userId_createdAt_idx" ON "ReportAnalysis"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ReportAnalysis_labReportId_createdAt_idx" ON "ReportAnalysis"("labReportId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "StorageObject" ADD CONSTRAINT "StorageObject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabReport" ADD CONSTRAINT "LabReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabReport" ADD CONSTRAINT "LabReport_sourceFileId_fkey" FOREIGN KEY ("sourceFileId") REFERENCES "StorageObject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcrJob" ADD CONSTRAINT "OcrJob_labReportId_fkey" FOREIGN KEY ("labReportId") REFERENCES "LabReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabReportOcr" ADD CONSTRAINT "LabReportOcr_labReportId_fkey" FOREIGN KEY ("labReportId") REFERENCES "LabReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_biomarkerId_fkey" FOREIGN KEY ("biomarkerId") REFERENCES "Biomarker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_labReportId_fkey" FOREIGN KEY ("labReportId") REFERENCES "LabReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_provenanceFileId_fkey" FOREIGN KEY ("provenanceFileId") REFERENCES "StorageObject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportAnalysis" ADD CONSTRAINT "ReportAnalysis_labReportId_fkey" FOREIGN KEY ("labReportId") REFERENCES "LabReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportAnalysis" ADD CONSTRAINT "ReportAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
