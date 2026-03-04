const { prisma } = require('../config/database');

async function listRides(filters = {}) {
  const { page = 1, limit = 20, status, origin, destination } = filters;
  const skip = (page - 1) * limit;

  const where = {};

  if (status) {
    where.status = status;
  } else {
    where.status = 'ACTIVE';
  }

  if (origin) {
    where.origin = { contains: origin, mode: 'insensitive' };
  }

  if (destination) {
    where.destination = { contains: destination, mode: 'insensitive' };
  }

  const [rides, total] = await Promise.all([
    prisma.ride.findMany({
      where,
      include: {
        driver: { select: { id: true, name: true, email: true } },
        vehicle: { select: { brand: true, model: true, plate: true } },
      },
      skip,
      take: limit,
      orderBy: { departureAt: 'asc' },
    }),
    prisma.ride.count({ where }),
  ]);

  return {
    data: rides,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getRideHistory(userId, role) {
  const where = role === 'DRIVER'
    ? { driverId: userId }
    : {
        passengers: {
          some: { passengerId: userId },
        },
      };

  const rides = await prisma.ride.findMany({
    where,
    include: {
      driver: { select: { id: true, name: true } },
      vehicle: { select: { brand: true, model: true, plate: true } },
      passengers: {
        include: { passenger: { select: { id: true, name: true } } },
      },
    },
    orderBy: { departureAt: 'desc' },
    take: 50,
  });

  return rides;
}

async function createRide(userId, data) {
  const driver = await prisma.user.findFirst({
    where: { id: userId, role: 'DRIVER' },
  });

  if (!driver) {
    const err = new Error('Apenas motoristas podem criar corridas');
    err.statusCode = 403;
    throw err;
  }

  const vehicle = await prisma.vehicle.findFirst({
    where: { id: data.vehicleId, driverId: userId },
  });

  if (!vehicle) {
    const err = new Error('Veículo não encontrado ou não pertence ao motorista');
    err.statusCode = 404;
    throw err;
  }

  const ride = await prisma.ride.create({
    data: {
      driverId: userId,
      vehicleId: data.vehicleId,
      origin: data.origin,
      destination: data.destination,
      distanceKm: data.distanceKm ? parseFloat(data.distanceKm) : null,
      suggestedValue: data.suggestedValue ? parseFloat(data.suggestedValue) : null,
      departureAt: new Date(data.departureAt),
      arrivalAt: new Date(data.arrivalAt),
      availableSeats: parseInt(data.availableSeats, 10) || 1,
    },
    include: {
      driver: { select: { id: true, name: true } },
      vehicle: { select: { brand: true, model: true, plate: true } },
    },
  });

  return ride;
}

async function requestRide(rideId, passengerId) {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    include: { passengers: true },
  });

  if (!ride) {
    const err = new Error('Corrida não encontrada');
    err.statusCode = 404;
    throw err;
  }

  if (ride.status !== 'ACTIVE') {
    const err = new Error('Corrida não está ativa');
    err.statusCode = 400;
    throw err;
  }

  const confirmedCount = ride.passengers.filter((p) => p.status === 'CONFIRMED').length;
  if (confirmedCount >= ride.availableSeats) {
    const err = new Error('Não há vagas disponíveis');
    err.statusCode = 400;
    throw err;
  }

  const existing = ride.passengers.find((p) => p.passengerId === passengerId);
  if (existing) {
    const err = new Error('Solicitação já realizada');
    err.statusCode = 409;
    throw err;
  }

  const participation = await prisma.ridePassenger.create({
    data: {
      rideId,
      passengerId,
      status: 'PENDING',
    },
    include: {
      ride: { include: { driver: { select: { name: true } } } },
    },
  });

  return participation;
}

async function updateRideStatus(rideId, userId, status) {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
  });

  if (!ride) {
    const err = new Error('Corrida não encontrada');
    err.statusCode = 404;
    throw err;
  }

  if (ride.driverId !== userId) {
    const err = new Error('Apenas o motorista pode alterar o status');
    err.statusCode = 403;
    throw err;
  }

  const validStatuses = ['ACTIVE', 'FINISHED', 'CANCELLED'];
  if (!validStatuses.includes(status)) {
    const err = new Error('Status inválido');
    err.statusCode = 400;
    throw err;
  }

  return prisma.ride.update({
    where: { id: rideId },
    data: { status },
    include: {
      driver: { select: { id: true, name: true } },
      vehicle: { select: { brand: true, model: true, plate: true } },
    },
  });
}

module.exports = {
  listRides,
  getRideHistory,
  createRide,
  requestRide,
  updateRideStatus,
};
