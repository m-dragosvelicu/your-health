-- CreateEnum
CREATE TYPE "BiomarkerCategory" AS ENUM ('CBC', 'METABOLIC', 'LIPIDS', 'RENAL', 'LIVER', 'THYROID', 'HORMONE', 'VITAMINS', 'INFLAMMATION', 'OTHER');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN', 'LOGOUT', 'USER_REGISTERED', 'PASSWORD_CHANGE', 'PASSWORD_RESET_REQUEST', 'LAB_REPORT_CREATE', 'LAB_REPORT_UPLOAD', 'LAB_REPORT_UPDATE', 'LAB_REPORT_DELETE', 'LAB_REPORT_VIEW', 'MEASUREMENT_CREATE', 'MEASUREMENT_VIEW', 'MEASUREMENT_UPDATE', 'MEASUREMENT_DELETE', 'AI_ANALYSIS_RUN', 'SHARE_LINK_CREATE', 'SHARE_LINK_REVOKE');

-- CreateTable
CREATE TABLE "Biomarker" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "BiomarkerCategory" NOT NULL DEFAULT 'OTHER',
    "canonicalUnit" TEXT NOT NULL,
    "defaultRefLow" DECIMAL(20,10),
    "defaultRefHigh" DECIMAL(20,10),
    "description" TEXT,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Biomarker_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "Biomarker_slug_key" ON "Biomarker"("slug");

-- CreateIndex
CREATE INDEX "Biomarker_category_name_idx" ON "Biomarker"("category", "name");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
