-- Each booking receives an opaque token used only in the customer's private
-- management link. It is intentionally separate from the human reference.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "Booking"
  ADD COLUMN "manageToken" TEXT NOT NULL DEFAULT gen_random_uuid()::text;

CREATE UNIQUE INDEX "Booking_manageToken_key" ON "Booking"("manageToken");
