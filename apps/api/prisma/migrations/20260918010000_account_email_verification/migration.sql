ALTER TABLE "User"
ADD COLUMN "emailVerificationCodeHash" TEXT,
ADD COLUMN "emailVerificationExpiresAt" TIMESTAMPTZ(6),
ADD COLUMN "emailVerificationAttempts" INTEGER NOT NULL DEFAULT 0;
