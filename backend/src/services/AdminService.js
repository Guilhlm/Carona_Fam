const { prisma } = require('../config/database');

async function listUsers(filters = {}) {
  const { page = 1, limit = 20, isBlocked, role, search } = filters;
  const skip = (page - 1) * limit;

  const where = {};

  if (typeof isBlocked === 'boolean') {
    where.isBlocked = isBlocked;
  }

  if (role) {
    where.role = role;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { ra: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        ra: true,
        role: true,
        isAdmin: true,
        isBlocked: true,
        createdAt: true,
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function listDrivers(filters = {}) {
  const { page = 1, limit = 20, search } = filters;
  const skip = (page - 1) * limit;

  const where = { role: 'DRIVER' };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [drivers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        vehiclesAsDriver: true,
        _count: {
          select: { ridesAsDriver: true },
        },
      },
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.user.count({ where }),
  ]);

  const data = drivers.map((d) => ({
    id: d.id,
    name: d.name,
    email: d.email,
    ra: d.ra,
    isBlocked: d.isBlocked,
    vehicles: d.vehiclesAsDriver,
    rideCount: d._count.ridesAsDriver,
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function listRides(filters = {}) {
  const { page = 1, limit = 20, status, search } = filters;
  const skip = (page - 1) * limit;

  const where = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { origin: { contains: search, mode: 'insensitive' } },
      { destination: { contains: search, mode: 'insensitive' } },
      {
        driver: {
          name: { contains: search, mode: 'insensitive' },
        },
      },
    ];
  }

  const [rides, total] = await Promise.all([
    prisma.ride.findMany({
      where,
      include: {
        driver: { select: { id: true, name: true, email: true } },
        vehicle: { select: { brand: true, model: true, plate: true } },
        passengers: {
          include: { passenger: { select: { id: true, name: true, email: true } } },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
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

async function blockUser(userId, block = true) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const err = new Error('Usuário não encontrado');
    err.statusCode = 404;
    throw err;
  }

  if (user.isAdmin || user.role === 'ADMIN') {
    const err = new Error('Não é possível bloquear administradores');
    err.statusCode = 403;
    throw err;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isBlocked: block },
    select: {
      id: true,
      name: true,
      email: true,
      isBlocked: true,
    },
  });

  return updated;
}

module.exports = {
  listUsers,
  listDrivers,
  listRides,
  blockUser,
};
