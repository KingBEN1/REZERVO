CREATE TYPE "BusinessVerificationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

CREATE TABLE "BusinessVerification" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "legalName" TEXT NOT NULL,
  "registrationNumber" TEXT NOT NULL,
  "contactName" TEXT NOT NULL,
  "contactPhone" TEXT NOT NULL,
  "website" TEXT,
  "status" "BusinessVerificationStatus" NOT NULL DEFAULT 'DRAFT',
  "submittedAt" TIMESTAMPTZ(6),
  "reviewedAt" TIMESTAMPTZ(6),
  "reviewedByUserId" TEXT,
  "reviewNote" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "BusinessVerification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessVerification_businessId_key" ON "BusinessVerification"("businessId");
CREATE INDEX "BusinessVerification_status_submittedAt_idx" ON "BusinessVerification"("status", "submittedAt");
ALTER TABLE "BusinessVerification" ADD CONSTRAINT "BusinessVerification_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
