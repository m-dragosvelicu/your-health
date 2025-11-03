-- CreateTable
CREATE TABLE "AuthAttempt" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT,
    "ip" TEXT,
    "action" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,

    CONSTRAINT "AuthAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthAttempt_email_action_createdAt_idx" ON "AuthAttempt"("email", "action", "createdAt");

-- CreateIndex
CREATE INDEX "AuthAttempt_ip_action_createdAt_idx" ON "AuthAttempt"("ip", "action", "createdAt");
