-- Adds category-specific catalog data without altering existing bookings.
ALTER TABLE "Staff"
ADD COLUMN "roomNumber" TEXT,
ADD COLUMN "bedCount" INTEGER;

ALTER TABLE "Service"
ADD COLUMN "bookingDetails" JSONB;
