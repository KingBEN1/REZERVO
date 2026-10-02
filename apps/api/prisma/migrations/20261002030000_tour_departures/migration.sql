ALTER TABLE "Booking" ADD COLUMN "tourDepartureId" TEXT;

CREATE TABLE "TourDeparture" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "startAt" TIMESTAMPTZ(6) NOT NULL,
  "endAt" TIMESTAMPTZ(6) NOT NULL,
  "capacity" INTEGER NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "TourDeparture_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TourDeparture_serviceId_startAt_active_idx" ON "TourDeparture"("serviceId", "startAt", "active");
CREATE INDEX "TourDeparture_staffId_startAt_idx" ON "TourDeparture"("staffId", "startAt");
CREATE INDEX "Booking_tourDepartureId_idx" ON "Booking"("tourDepartureId");

ALTER TABLE "TourDeparture" ADD CONSTRAINT "TourDeparture_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TourDeparture" ADD CONSTRAINT "TourDeparture_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_tourDepartureId_fkey" FOREIGN KEY ("tourDepartureId") REFERENCES "TourDeparture"("id") ON DELETE SET NULL ON UPDATE CASCADE;
