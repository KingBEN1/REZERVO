CREATE TYPE "BookingKind" AS ENUM ('APPOINTMENT', 'ACCOMMODATION', 'TRANSPORT');

ALTER TABLE "Staff"
  ADD COLUMN "capacity" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "Booking"
  ADD COLUMN "kind" "BookingKind" NOT NULL DEFAULT 'APPOINTMENT',
  ADD COLUMN "checkInDate" TIMESTAMPTZ(6),
  ADD COLUMN "checkOutDate" TIMESTAMPTZ(6),
  ADD COLUMN "guestCount" INTEGER,
  ADD COLUMN "pickupAddress" TEXT,
  ADD COLUMN "destinationAddress" TEXT,
  ADD COLUMN "passengerCount" INTEGER;

CREATE INDEX "Booking_businessId_kind_checkInDate_idx" ON "Booking"("businessId", "kind", "checkInDate");
