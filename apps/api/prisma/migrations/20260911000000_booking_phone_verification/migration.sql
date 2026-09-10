ALTER TABLE "BookingVerificationChallenge"
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'EMAIL';

CREATE INDEX "BookingVerificationChallenge_phone_createdAt_idx"
  ON "BookingVerificationChallenge"("phone", "createdAt");
