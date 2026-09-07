CREATE TABLE "BookingVerificationChallenge" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMPTZ(6) NOT NULL,
  "verifiedAt" TIMESTAMPTZ(6),
  "usedAt" TIMESTAMPTZ(6),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BookingVerificationChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BookingVerificationChallenge_email_createdAt_idx" ON "BookingVerificationChallenge"("email", "createdAt");
CREATE INDEX "BookingVerificationChallenge_expiresAt_idx" ON "BookingVerificationChallenge"("expiresAt");
