const { prisma } = require('../config/database');

function getOrderBy(order) {
  if (order === 'passengers_desc') {
    return { passengers: { _count: 'desc' } };
  }
  if (order === 'driver_asc') {
    return { driver: { name: 'asc' } };
  }
  if (order === 'passenger_asc') {
    return null; // será tratado com fetch + sort em memória
  }
  if (order === 'date_desc') {
    return { departureAt: 'desc' };
  }
  if (order === 'date_asc') {
    return { departureAt: 'asc' };
  }
  return { departureAt: 'asc' };
}

async function listRides(filters = {}) {
  const pageNumber = Math.max(1, parseInt(filters.page, 10) || 1);
  const limitNumber = Math.min(100, Math.max(1, parseInt(filters.limit, 2) || 20));
  const { status, origin, destination, search, order } = filters;
  const skip = (pageNumber - 1) * limitNumber;

  const where = {};

  if (status) {
    where.status = status;
  }

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { origin: { contains: term, mode: 'insensitive' } },
      { destination: { contains: term, mode: 'insensitive' } },
      { driver: { name: { contains: term, mode: 'insensitive' } } },
      { passengers: { some: { passenger: { name: { contains: term, mode: 'insensitive' } } } } },
    ];
  } else {
    if (origin) {
      where.origin = { contains: origin, mode: 'insensitive' };
    }
    if (destination) {
      where.destination = { contains: destination, mode: 'insensitive' };
    }
  }

  const include = {
    driver: { select: { id: true, name: true, email: true } },
    vehicle: { select: { brand: true, model: true, plate: true } },
    passengers: {
      include: {
        passenger: { select: { id: true, name: true } },
      },
    },
  };

  // Ordenação por usuário (primeiro passageiro): Prisma não suporta, buscamos tudo e ordenamos em memória
  if (order === 'passenger_asc') {
    const [allRides, total] = await Promise.all([
      prisma.ride.findMany({
        where,
        include,
        orderBy: { departureAt: 'asc' },
      }),
      prisma.ride.count({ where }),
    ]);
    const sorted = [...allRides].sort((a, b) => {
      const nameA = a.passengers?.[0]?.passenger?.name ?? '';
      const nameB = b.passengers?.[0]?.passenger?.name ?? '';
      return String(nameA).localeCompare(String(nameB));
    });
    const rides = sorted.slice(skip, skip + limitNumber);
    return {
      data: rides,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  const orderBy = getOrderBy(order);
  const [rides, total] = await Promise.all([
    prisma.ride.findMany({
      where,
      include,
      skip,
      take: limitNumber,
      orderBy,
    }),
    prisma.ride.count({ where }),
  ]);

  return {
    data: rides,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
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

async function cancelRideByAdmin(rideId) {
  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
  });

  if (!ride) {
    const err = new Error('Corrida não encontrada');
    err.statusCode = 404;
    throw err;
  }

  if (ride.status === 'CANCELLED') {
    const err = new Error('Corrida já está cancelada');
    err.statusCode = 400;
    throw err;
  }

  return prisma.ride.update({
    where: { id: rideId },
    data: { status: 'CANCELLED' },
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
  cancelRideByAdmin,
};
