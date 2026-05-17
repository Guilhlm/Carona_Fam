-- Migration: refactor Ride to Uber-style flow while preserving legacy data.

-- 1. New enums
CREATE TYPE "CancellationActor" AS ENUM ('PASSENGER', 'DRIVER', 'ADMIN', 'SYSTEM');

-- 2. Replace RideStatus enum, mapping legacy values
ALTER TYPE "RideStatus" RENAME TO "RideStatus_old";
CREATE TYPE "RideStatus" AS ENUM (
  'WAITING_DRIVER',
  'DRIVER_ACCEPTED',
  'DRIVER_ARRIVING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

ALTER TABLE "Ride" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Ride"
  ALTER COLUMN "status" TYPE "RideStatus"
  USING (
    CASE "status"::text
      WHEN 'ACTIVE'    THEN 'COMPLETED'
      WHEN 'FINISHED'  THEN 'COMPLETED'
      WHEN 'CANCELLED' THEN 'CANCELLED'
      ELSE 'COMPLETED'
    END
  )::"RideStatus";
ALTER TABLE "Ride" ALTER COLUMN "status" SET DEFAULT 'WAITING_DRIVER';
DROP TYPE "RideStatus_old";

-- 3. Add new columns to Ride
ALTER TABLE "Ride"
  ADD COLUMN "requesterId"        TEXT,
  ADD COLUMN "originLat"          DECIMAL(10,7),
  ADD COLUMN "originLng"          DECIMAL(10,7),
  ADD COLUMN "destinationLat"     DECIMAL(10,7),
  ADD COLUMN "destinationLng"     DECIMAL(10,7),
  ADD COLUMN "estimatedTimeMin"   INTEGER,
  ADD COLUMN "estimatedValue"     DECIMAL(8,2),
  ADD COLUMN "actualValue"        DECIMAL(8,2),
  ADD COLUMN "requestedAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "acceptedAt"         TIMESTAMP(3),
  ADD COLUMN "arrivingAt"         TIMESTAMP(3),
  ADD COLUMN "startedAt"          TIMESTAMP(3),
  ADD COLUMN "completedAt"        TIMESTAMP(3),
  ADD COLUMN "cancelledAt"        TIMESTAMP(3),
  ADD COLUMN "cancellationReason" TEXT,
  ADD COLUMN "cancelledBy"        "CancellationActor";

-- 4. Backfill estimatedValue from legacy suggestedValue
UPDATE "Ride" SET "estimatedValue" = "suggestedValue" WHERE "suggestedValue" IS NOT NULL;

-- 5. Backfill requesterId for legacy rides (first passenger or fallback to driver)
UPDATE "Ride" r
SET "requesterId" = COALESCE(
  (
    SELECT rp."passengerId"
    FROM "RidePassenger" rp
    WHERE rp."rideId" = r."id"
    ORDER BY rp."requestedAt" ASC
    LIMIT 1
  ),
  r."driverId"
);

-- 6. Backfill completedAt for legacy completed rides
UPDATE "Ride"
SET "completedAt" = COALESCE("arrivalAt", "updatedAt")
WHERE "status" = 'COMPLETED' AND "completedAt" IS NULL;

UPDATE "Ride"
SET "cancelledAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP),
    "cancelledBy" = 'ADMIN'
WHERE "status" = 'CANCELLED' AND "cancelledAt" IS NULL;

-- 7. Drop legacy suggestedValue column
ALTER TABLE "Ride" DROP COLUMN "suggestedValue";

-- 8. Make driverId / vehicleId / departureAt / arrivalAt nullable (new rides start without driver)
ALTER TABLE "Ride"
  ALTER COLUMN "driverId"       DROP NOT NULL,
  ALTER COLUMN "vehicleId"      DROP NOT NULL,
  ALTER COLUMN "departureAt"    DROP NOT NULL,
  ALTER COLUMN "arrivalAt"      DROP NOT NULL,
  ALTER COLUMN "availableSeats" SET DEFAULT 1;

-- 9. requesterId becomes required + FK
ALTER TABLE "Ride" ALTER COLUMN "requesterId" SET NOT NULL;
ALTER TABLE "Ride"
  ADD CONSTRAINT "Ride_requesterId_fkey"
  FOREIGN KEY ("requesterId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 10. Recreate driver/vehicle FKs with SET NULL on delete (motorista pode ser desativado sem perder histórico)
ALTER TABLE "Ride" DROP CONSTRAINT IF EXISTS "Ride_driverId_fkey";
ALTER TABLE "Ride" DROP CONSTRAINT IF EXISTS "Ride_vehicleId_fkey";
ALTER TABLE "Ride"
  ADD CONSTRAINT "Ride_driverId_fkey"
  FOREIGN KEY ("driverId") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Ride"
  ADD CONSTRAINT "Ride_vehicleId_fkey"
  FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- 11. Indexes
CREATE INDEX "Ride_status_idx"      ON "Ride"("status");
CREATE INDEX "Ride_requesterId_idx" ON "Ride"("requesterId");
CREATE INDEX "Ride_driverId_idx"    ON "Ride"("driverId");

-- 12. RideStop table
CREATE TABLE "RideStop" (
  "id"        TEXT NOT NULL,
  "rideId"    TEXT NOT NULL,
  "ordering"  INTEGER NOT NULL,
  "address"   TEXT NOT NULL,
  "lat"       DECIMAL(10,7),
  "lng"       DECIMAL(10,7),
  "reachedAt" TIMESTAMP(3),
  CONSTRAINT "RideStop_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "RideStop_rideId_fkey" FOREIGN KEY ("rideId")
    REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "RideStop_rideId_ordering_key" ON "RideStop"("rideId", "ordering");
CREATE INDEX "RideStop_rideId_idx" ON "RideStop"("rideId");
