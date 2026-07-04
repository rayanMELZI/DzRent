-- Add in-app read tracking to the notification center
ALTER TABLE "notification_logs" ADD COLUMN "readAt" TIMESTAMPTZ(0);

CREATE INDEX "notification_logs_userId_readAt_idx" ON "notification_logs"("userId", "readAt");
