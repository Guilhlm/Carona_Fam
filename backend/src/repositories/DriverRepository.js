class DriverRepository {
  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  listActiveDrivers(skip, take) {
    return Promise.all([
      this.prisma.user.findMany({
        where: {
          role: 'DRIVER',
          isBlocked: false,
        },
        include: {
          vehiclesAsDriver: true,
        },
        skip,
        take,
        orderBy: { name: 'asc' },
      }),
      this.prisma.user.count({
        where: {
          role: 'DRIVER',
          isBlocked: false,
        },
      }),
    ]);
  }

  findDriverDetailsById(id) {
    return this.prisma.user.findFirst({
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
  }
}

module.exports = DriverRepository;
