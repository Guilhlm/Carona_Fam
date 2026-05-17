class RideRepository {
  static RIDE_DETAIL_INCLUDE = {
    requester: {
      select: { id: true, name: true, phone: true, photoUrl: true },
    },
    driver: {
      select: { id: true, name: true, phone: true, photoUrl: true },
    },
    vehicle: {
      select: { id: true, brand: true, model: true, plate: true, photoUrl: true },
    },
    stops: { orderBy: { ordering: 'asc' } },
    passengers: {
      include: { passenger: { select: { id: true, name: true } } },
    },
  };

  static RIDE_CARD_INCLUDE = {
    requester: { select: { id: true, name: true, photoUrl: true } },
    driver: { select: { id: true, name: true } },
    vehicle: { select: { brand: true, model: true, plate: true } },
    stops: { orderBy: { ordering: 'asc' } },
  };

  static ACTIVE_STATUSES = [
    'WAITING_DRIVER',
    'DRIVER_ACCEPTED',
    'DRIVER_ARRIVING',
    'IN_PROGRESS',
  ];

  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  listRides(whereClause, includeClause, queryOptions = {}) {
    const findManyArgs = {
      where: whereClause,
      include: includeClause,
      orderBy: queryOptions.orderBy || { requestedAt: 'desc' },
    };

    if (typeof queryOptions.skip === 'number') findManyArgs.skip = queryOptions.skip;
    if (typeof queryOptions.take === 'number') findManyArgs.take = queryOptions.take;

    return Promise.all([
      this.prisma.ride.findMany(findManyArgs),
      this.prisma.ride.count({ where: whereClause }),
    ]);
  }

  findRideHistoryByUser(userId, role) {
    const whereClause = role === 'DRIVER'
      ? { OR: [{ driverId: userId }, { requesterId: userId }] }
      : { OR: [{ requesterId: userId }, { passengers: { some: { passengerId: userId } } }] };

    return this.prisma.ride.findMany({
      where: {
        ...whereClause,
        status: { in: ['COMPLETED', 'CANCELLED'] },
      },
      include: RideRepository.RIDE_CARD_INCLUDE,
      orderBy: { requestedAt: 'desc' },
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

  findFirstActiveVehicle(driverId) {
    return this.prisma.vehicle.findFirst({
      where: { driverId, isDisabled: false },
      orderBy: { createdAt: 'asc' },
    });
  }

  createRideRequest({
    requesterId,
    origin,
    destination,
    originLat,
    originLng,
    destinationLat,
    destinationLng,
    distanceKm,
    estimatedTimeMin,
    estimatedValue,
    stops,
  }) {
    return this.prisma.ride.create({
      data: {
        requesterId,
        origin,
        destination,
        originLat,
        originLng,
        destinationLat,
        destinationLng,
        distanceKm,
        estimatedTimeMin,
        estimatedValue,
        status: 'WAITING_DRIVER',
        stops: stops && stops.length > 0
          ? {
              create: stops.map((stopRecord, stopIndex) => ({
                ordering: stopIndex,
                address: stopRecord.address,
                lat: stopRecord.lat,
                lng: stopRecord.lng,
              })),
            }
          : undefined,
      },
      include: RideRepository.RIDE_DETAIL_INCLUDE,
    });
  }

  findOpenRides() {
    return this.prisma.ride.findMany({
      where: { status: 'WAITING_DRIVER', driverId: null },
      include: RideRepository.RIDE_DETAIL_INCLUDE,
      orderBy: { requestedAt: 'asc' },
    });
  }

  findActiveRideForUser(userId) {
    return this.prisma.ride.findFirst({
      where: {
        status: { in: RideRepository.ACTIVE_STATUSES },
        OR: [
          { requesterId: userId },
          { driverId: userId },
          { passengers: { some: { passengerId: userId, status: { not: 'CANCELLED' } } } },
          {
            scheduledRide: {
              joinedPassengers: { some: { passengerId: userId } },
            },
          },
        ],
      },
      include: RideRepository.RIDE_DETAIL_INCLUDE,
      orderBy: { requestedAt: 'desc' },
    });
  }

  findScheduledCaronaOnRide(rideId, userId) {
    return this.prisma.scheduledRide.findFirst({
      where: {
        rideId,
        joinedPassengers: { some: { passengerId: userId } },
        status: { not: 'CANCELLED' },
      },
      select: { id: true },
    });
  }

  findRideDetail(rideId) {
    return this.prisma.ride.findUnique({
      where: { id: rideId },
      include: RideRepository.RIDE_DETAIL_INCLUDE,
    });
  }

  findRideById(rideId) {
    return this.prisma.ride.findUnique({ where: { id: rideId } });
  }

  async assignDriverToOpenRide(rideId, driverId, vehicleId) {
    const updateResult = await this.prisma.ride.updateMany({
      where: { id: rideId, status: 'WAITING_DRIVER', driverId: null },
      data: {
        driverId,
        vehicleId: vehicleId ?? null,
        status: 'DRIVER_ACCEPTED',
        acceptedAt: new Date(),
      },
    });

    if (updateResult.count === 0) return null;
    return this.findRideDetail(rideId);
  }

  updateRideStatus(rideId, status, extraData = {}) {
    return this.prisma.ride.update({
      where: { id: rideId },
      data: { status, ...extraData },
      include: RideRepository.RIDE_DETAIL_INCLUDE,
    });
  }

  cancelRide(rideId, { reason, actor }) {
    return this.prisma.ride.update({
      where: { id: rideId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason,
        cancelledBy: actor,
      },
      include: RideRepository.RIDE_DETAIL_INCLUDE,
    });
  }

  findRideWithPassengers(rideId) {
    return this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { passengers: true },
    });
  }

  createRidePassengerRequest(rideId, passengerId) {
    return this.prisma.ridePassenger.create({
      data: { rideId, passengerId, status: 'PENDING' },
      include: {
        ride: { include: { driver: { select: { name: true } } } },
      },
    });
  }

  createRidePassengerConfirmed(rideId, passengerId) {
    return this.prisma.ridePassenger.upsert({
      where: {
        rideId_passengerId: { rideId, passengerId },
      },
      create: { rideId, passengerId, status: 'CONFIRMED' },
      update: { status: 'CONFIRMED' },
    });
  }
}

module.exports = RideRepository;
