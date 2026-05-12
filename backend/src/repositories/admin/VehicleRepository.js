class VehicleRepository {
  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  async listVehicles(filters = {}) {
    const { page = 1, limit = 20, isDisabled, search, order } = filters;
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 20;
    const skip = (pageNumber - 1) * limitNumber;

    const where = {};

    if (isDisabled === 'true' || isDisabled === true) {
      where.isDisabled = true;
    } else if (isDisabled === 'false' || isDisabled === false) {
      where.isDisabled = false;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { plate: { contains: term, mode: 'insensitive' } },
        { brand: { contains: term, mode: 'insensitive' } },
        { model: { contains: term, mode: 'insensitive' } },
        { driver: { name: { contains: term, mode: 'insensitive' } } },
        { driver: { email: { contains: term, mode: 'insensitive' } } },
      ];
    }

    let orderBy = [{ plate: 'asc' }];
    if (order === 'brand_asc') orderBy = [{ brand: 'asc' }, { model: 'asc' }];
    else if (order === 'brand_desc') orderBy = [{ brand: 'desc' }, { model: 'desc' }];
    else if (order === 'driver_asc') orderBy = [{ driver: { name: 'asc' } }];
    else if (order === 'driver_desc') orderBy = [{ driver: { name: 'desc' } }];

    const [vehicles, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        include: { driver: { select: { id: true, name: true, email: true, ra: true } } },
        skip,
        take: limitNumber,
        orderBy,
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return {
      data: vehicles.map((vehicle) => ({
        id: vehicle.id,
        brand: vehicle.brand,
        model: vehicle.model,
        plate: vehicle.plate,
        year: vehicle.year,
        isDisabled: !!vehicle.isDisabled,
        disabledReason: vehicle.disabledReason ?? null,
        driverId: vehicle.driver?.id,
        driverName: vehicle.driver?.name,
        driverEmail: vehicle.driver?.email,
        driverRa: vehicle.driver?.ra ?? null,
      })),
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  findById(vehicleId) {
    return this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
  }

  updateDisableStatus(vehicleId, data) {
    return this.prisma.vehicle.update({
      where: { id: vehicleId },
      data,
      include: { driver: { select: { id: true, name: true, email: true } } },
    });
  }
}

module.exports = VehicleRepository;
