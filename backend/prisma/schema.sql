-- =============================================
-- Carona FAM - Schema PostgreSQL
-- Refatorado a partir do modelo original (alunos, veiculos, corridas, etc.)
-- Adaptado para a aplicação atual com autenticação e roles
-- =============================================

-- Enums (equivalente aos ENUMs do modelo original)
CREATE TYPE "UserRole" AS ENUM ('USER', 'DRIVER', 'ADMIN');
CREATE TYPE "Gender" AS ENUM ('MASCULINO', 'FEMININO', 'OUTRO');
CREATE TYPE "RideStatus" AS ENUM ('ACTIVE', 'FINISHED', 'CANCELLED');
CREATE TYPE "RidePassengerStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- Tabela User (equivalente a alunos)
-- Adicionado: passwordHash, role, isBlocked para autenticação
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ra" TEXT,
    "course" TEXT,
    "gender" "Gender",
    "age" INTEGER,
    "phone" TEXT,
    "cep" TEXT,
    "photoUrl" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_ra_key" ON "User"("ra");

-- Tabela Vehicle (equivalente a veiculos)
-- id_aluno -> driverId (referência ao User)
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "plate" TEXT NOT NULL,
    "year" INTEGER,
    "capacityTotal" INTEGER NOT NULL,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Vehicle_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "Vehicle_plate_key" ON "Vehicle"("plate");

-- Tabela Ride (equivalente a corridas)
-- data_hora_saida -> departureAt, data_hora_chegada -> arrivalAt
-- vagas_disponiveis -> availableSeats, status em inglês
CREATE TABLE "Ride" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "distanceKm" DECIMAL(6,2),
    "suggestedValue" DECIMAL(8,2),
    "departureAt" TIMESTAMP(3) NOT NULL,
    "arrivalAt" TIMESTAMP(3) NOT NULL,
    "availableSeats" INTEGER NOT NULL,
    "status" "RideStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ride_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Ride_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ride_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabela RidePassenger (equivalente a corrida_passageiros)
-- id_participacao -> id, status em inglês
CREATE TABLE "RidePassenger" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "passengerId" TEXT NOT NULL,
    "status" "RidePassengerStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RidePassenger_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RidePassenger_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RidePassenger_passengerId_fkey" FOREIGN KEY ("passengerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "RidePassenger_rideId_passengerId_key" ON "RidePassenger"("rideId", "passengerId");
CREATE INDEX "RidePassenger_rideId_idx" ON "RidePassenger"("rideId");
CREATE INDEX "RidePassenger_passengerId_idx" ON "RidePassenger"("passengerId");

-- Tabela Review (equivalente a avaliacoes)
-- id_avaliacao -> id, nota -> rating
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "rideId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewedId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Review_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Review_reviewedId_fkey" FOREIGN KEY ("reviewedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "Review_rideId_idx" ON "Review"("rideId");
CREATE INDEX "Review_reviewerId_idx" ON "Review"("reviewerId");
CREATE INDEX "Review_reviewedId_idx" ON "Review"("reviewedId");
