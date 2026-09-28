ALTER TABLE "BusinessSettings"
  ADD COLUMN "cashPaymentEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "bankTransferEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "bankName" TEXT,
  ADD COLUMN "bankAccountHolder" TEXT,
  ADD COLUMN "bankIban" TEXT,
  ADD COLUMN "bankReferenceInstructions" TEXT;
