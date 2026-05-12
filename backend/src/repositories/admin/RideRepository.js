class RideRepository {
  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  getOrderBy(order) {
    if (order === 'passengers_desc') {
      return { passengers: { _count: 'desc' } };
    }
    if (order === 'driver_asc') {
      return { driver: { name: 'asc' } };
    }
    if (order === 'passenger_asc') {
      return null;
    }
    if (order === 'date_desc') {
      return { departureAt: 'desc' };
    }
    if (order === 'date_asc') {
      return { departureAt: 'asc' };
    }
    return { departureAt: 'asc' };
  }

  async listRides(filters = {}) {
    const pageNumber = Math.max(1, parseInt(filters.page, 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 20));
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

    if (order === 'passenger_asc') {
      const [allRides, total] = await Promise.all([
        this.prisma.ride.findMany({
          where,
          include,
          orderBy: { departureAt: 'asc' },
        }),
        this.prisma.ride.count({ where }),
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

    const orderBy = this.getOrderBy(order);
    const [rides, total] = await Promise.all([
      this.prisma.ride.findMany({
        where,
        include,
        skip,
        take: limitNumber,
        orderBy,
      }),
      this.prisma.ride.count({ where }),
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

  findById(rideId) {
    return this.prisma.ride.findUnique({
      where: { id: rideId },
    });
  }

  cancelRide(rideId) {
    return this.prisma.ride.update({
      where: { id: rideId },
      data: { status: 'CANCELLED' },
      include: {
        driver: { select: { id: true, name: true } },
        vehicle: { select: { brand: true, model: true, plate: true } },
      },
    });
  }
}

module.exports = RideRepository;
