-- CreateEnum
CREATE TYPE "ScheduledRideStatus" AS ENUM ('OPEN', 'REQUESTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "ScheduledRide"
  ADD COLUMN "status" "ScheduledRideStatus" NOT NULL DEFAULT 'OPEN',
  ADD COLUMN "rideId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledRide_rideId_key" ON "ScheduledRide"("rideId");

-- CreateIndex
CREATE INDEX "ScheduledRide_status_idx" ON "ScheduledRide"("status");

-- AddForeignKey
ALTER TABLE "ScheduledRide" ADD CONSTRAINT "ScheduledRide_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ScheduledRidePassenger" (
    "id" TEXT NOT NULL,
    "scheduledRideId" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "pickupLat" DECIMAL(10,7) NOT NULL,
    "pickupLng" DECIMAL(10,7) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledRidePassenger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScheduledRidePassenger_scheduledRideId_passengerId_key" ON "ScheduledRidePassenger"("scheduledRideId", "passengerId");

-- CreateIndex
CREATE INDEX "ScheduledRidePassenger_scheduledRideId_idx" ON "ScheduledRidePassenger"("scheduledRideId");

-- CreateIndex
CREATE INDEX "ScheduledRidePassenger_passengerId_idx" ON "ScheduledRidePassenger"("passengerId");

-- AddForeignKey
ALTER TABLE "ScheduledRidePassenger" ADD CONSTRAINT "ScheduledRidePassenger_scheduledRideId_fkey" FOREIGN KEY ("scheduledRideId") REFERENCES "ScheduledRide"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledRidePassenger" ADD CONSTRAINT "ScheduledRidePassenger_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
