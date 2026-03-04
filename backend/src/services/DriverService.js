const { prisma } = require('../config/database');

async function listDrivers(filters = {}) {
  const { page = 1, limit = 20 } = filters;
  const skip = (page - 1) * limit;

  const [drivers, total] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: 'DRIVER',
        isBlocked: false,
      },
      include: {
        vehiclesAsDriver: true,
      },
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.user.count({
      where: {
        role: 'DRIVER',
        isBlocked: false,
      },
    }),
  ]);

  return {
    data: drivers.map((d) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      ra: d.ra,
      vehicles: d.vehiclesAsDriver,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function getDriverById(id) {
  const driver = await prisma.user.findFirst({
    where: {
      id,
      role: 'DRIVER',
    },
    include: {
      vehiclesAsDriver: true,
      ridesAsDriver: {
        include: { vehicle: true },
        take: 10,
      },
      reviewsReceived: {
        include: { reviewer: { select: { name: true } } },
        take: 10,
      },
    },
  });

  if (!driver) {
    const err = new Error('Motorista não encontrado');
    err.statusCode = 404;
    throw err;
  }

  const avgRating =
    driver.reviewsReceived.length > 0
      ? driver.reviewsReceived.reduce((s, r) => s + r.rating, 0) / driver.reviewsReceived.length
      : null;

  return {
    ...driver,
    averageRating: avgRating ? Math.round(avgRating * 10) / 10 : null,
  };
}

module.exports = {
  listDrivers,
  getDriverById,
};
