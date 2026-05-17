-- CreateTable
CREATE TABLE "ScheduledRide" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "origin" TEXT,
    "destination" TEXT NOT NULL,
    "originLat" DECIMAL(10,7),
    "originLng" DECIMAL(10,7),
    "destinationLat" DECIMAL(10,7),
    "destinationLng" DECIMAL(10,7),
    "departureAt" TIMESTAMP(3) NOT NULL,
    "returnAt" TIMESTAMP(3),
    "passengers" INTEGER NOT NULL DEFAULT 1,
    "allowNewPassengers" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledRide_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ScheduledRide_creatorId_idx" ON "ScheduledRide"("creatorId");
CREATE INDEX "ScheduledRide_departureAt_idx" ON "ScheduledRide"("departureAt");
CREATE INDEX "ScheduledRide_allowNewPassengers_idx" ON "ScheduledRide"("allowNewPassengers");

ALTER TABLE "ScheduledRide" ADD CONSTRAINT "ScheduledRide_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
