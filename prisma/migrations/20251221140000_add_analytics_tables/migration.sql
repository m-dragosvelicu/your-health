-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT,
    "category" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "label" TEXT,
    "value" DOUBLE PRECISION,
    "path" TEXT,
    "deviceType" TEXT,
    "referrerDomain" TEXT,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsDailyStat" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "uniqueSessions" INTEGER NOT NULL DEFAULT 0,
    "uniqueUsers" INTEGER NOT NULL DEFAULT 0,
    "labsUploaded" INTEGER NOT NULL DEFAULT 0,
    "medicationsCreated" INTEGER NOT NULL DEFAULT 0,
    "medicationsLogged" INTEGER NOT NULL DEFAULT 0,
    "avgSessionDuration" DOUBLE PRECISION,
    "totalSessionTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsDailyStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsFeatureUsage" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "feature" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsFeatureUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_category_action_idx" ON "AnalyticsEvent"("category", "action");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_userId_createdAt_idx" ON "AnalyticsEvent"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsDailyStat_date_key" ON "AnalyticsDailyStat"("date");

-- CreateIndex
CREATE INDEX "AnalyticsDailyStat_date_idx" ON "AnalyticsDailyStat"("date");

-- CreateIndex
CREATE INDEX "AnalyticsFeatureUsage_date_idx" ON "AnalyticsFeatureUsage"("date");

-- CreateIndex
CREATE INDEX "AnalyticsFeatureUsage_feature_idx" ON "AnalyticsFeatureUsage"("feature");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsFeatureUsage_date_feature_action_key" ON "AnalyticsFeatureUsage"("date", "feature", "action");
