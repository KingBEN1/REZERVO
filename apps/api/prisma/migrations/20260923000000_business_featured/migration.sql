ALTER TABLE "Business"
ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Business_featured_idx" ON "Business"("featured");

-- Preserve the existing public demo as the initial promoted business.
UPDATE "Business"
SET "featured" = true, "status" = 'ACTIVE'
WHERE "slug" = 'blend-barber';
