ALTER TABLE "BusinessSettings"
  ADD COLUMN "requirePrepayment" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "depositPercent" INTEGER NOT NULL DEFAULT 100;
