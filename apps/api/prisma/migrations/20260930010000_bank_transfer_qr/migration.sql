-- Stores the bank-issued QR URL template for a business. The template is optional
-- because only a participating bank can issue a valid CBK QR endpoint/PID.
ALTER TABLE "BusinessSettings"
ADD COLUMN "bankQrUrlTemplate" TEXT;
