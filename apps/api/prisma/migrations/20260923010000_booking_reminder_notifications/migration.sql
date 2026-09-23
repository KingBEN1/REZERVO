ALTER TABLE "Notification"
ADD COLUMN "bookingId" TEXT;

CREATE INDEX "Notification_bookingId_idx" ON "Notification"("bookingId");

CREATE UNIQUE INDEX "Notification_bookingId_template_key"
ON "Notification"("bookingId", "template");
