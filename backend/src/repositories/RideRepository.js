class RideRepository {
  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  listRides(where, include, options = {}) {
    const query = {
      where,
      include,
      orderBy: options.orderBy || { departureAt: 'asc' },
    };

    if (typeof options.skip === 'number') {
      query.skip = options.skip;
    }

    if (typeof options.take === 'number') {
      query.take = options.take;
    }

    return Promise.all([
      this.prisma.ride.findMany(query),
      this.prisma.ride.count({ where }),
    ]);
  }

  findRideHistoryByUser(userId, role) {
    const where = role === 'DRIVER'
      ? { driverId: userId }
      : {
          passengers: {
            some: { passengerId: userId },
          },
        };

    return this.prisma.ride.findMany({
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
  }

  findDriverById(driverId) {
    return this.prisma.user.findFirst({
      where: { id: driverId, role: 'DRIVER' },
    });
  }

  findVehicleByDriver(vehicleId, driverId) {
    return this.prisma.vehicle.findFirst({
      where: { id: vehicleId, driverId },
    });
  }

  createRide(data) {
    return this.prisma.ride.create({
      data,
      include: {
        driver: { select: { id: true, name: true } },
        vehicle: { select: { brand: true, model: true, plate: true } },
      },
    });
  }

  findRideWithPassengers(rideId) {
    return this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { passengers: true },
    });
  }

  createRideRequest(rideId, passengerId) {
    return this.prisma.ridePassenger.create({
      data: {
        rideId,
        passengerId,
        status: 'PENDING',
      },
      include: {
        ride: { include: { driver: { select: { name: true } } } },
      },
    });
  }

  findRideById(id) {
    return this.prisma.ride.findUnique({
      where: { id },
    });
  }

  updateRideStatus(id, status) {
    return this.prisma.ride.update({
      where: { id },
      data: { status },
      include: {
        driver: { select: { id: true, name: true } },
        vehicle: { select: { brand: true, model: true, plate: true } },
      },
    });
  }
}

module.exports = RideRepository;
