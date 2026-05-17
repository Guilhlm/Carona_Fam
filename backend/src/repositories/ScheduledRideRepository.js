class ScheduledRideRepository {
  static CREATOR_SELECT = {
    id: true,
    name: true,
    phone: true,
    photoUrl: true,
    role: true,
  };

  static PASSENGER_SELECT = {
    id: true,
    name: true,
    phone: true,
    photoUrl: true,
  };

  static ACTIVE_RIDE_STATUSES = [
    'WAITING_DRIVER',
    'DRIVER_ACCEPTED',
    'DRIVER_ARRIVING',
    'IN_PROGRESS',
  ];

  static TIMEZONE_TOLERANCE_HOURS = 3;

  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  static buildDefaultInclude() {
    return {
      creator: { select: ScheduledRideRepository.CREATOR_SELECT },
      joinedPassengers: {
        orderBy: { createdAt: 'asc' },
        include: { passenger: { select: ScheduledRideRepository.PASSENGER_SELECT } },
      },
      ride: { select: { id: true, status: true } },
    };
  }

  static buildUpcomingDepartureFilter() {
    const toleranceMs = ScheduledRideRepository.TIMEZONE_TOLERANCE_HOURS * 60 * 60 * 1000;
    return { gte: new Date(Date.now() - toleranceMs) };
  }

  create(scheduledRideData) {
    return this.prisma.scheduledRide.create({
      data: scheduledRideData,
      include: ScheduledRideRepository.buildDefaultInclude(),
    });
  }

  findById(scheduledRideId) {
    return this.prisma.scheduledRide.findUnique({
      where: { id: scheduledRideId },
      include: ScheduledRideRepository.buildDefaultInclude(),
    });
  }

  findMine(creatorId) {
    return this.prisma.scheduledRide.findMany({
      where: {
        creatorId,
        status: 'OPEN',
      },
      include: ScheduledRideRepository.buildDefaultInclude(),
      orderBy: { departureAt: 'asc' },
    });
  }

  findJoinedByPassenger(passengerId) {
    return this.prisma.scheduledRide.findMany({
      where: {
        joinedPassengers: { some: { passengerId } },
        OR: [
          {
            status: 'REQUESTED',
            ride: { status: { in: ScheduledRideRepository.ACTIVE_RIDE_STATUSES } },
          },
          {
            status: 'OPEN',
            departureAt: ScheduledRideRepository.buildUpcomingDepartureFilter(),
          },
        ],
      },
      include: ScheduledRideRepository.buildDefaultInclude(),
      orderBy: { departureAt: 'asc' },
    });
  }

  findOpenForCommunity(userId) {
    return this.prisma.scheduledRide.findMany({
      where: {
        departureAt: ScheduledRideRepository.buildUpcomingDepartureFilter(),
        creatorId: { not: userId },
        status: 'OPEN',
        allowNewPassengers: true,
      },
      include: ScheduledRideRepository.buildDefaultInclude(),
      orderBy: { departureAt: 'asc' },
    });
  }

  findAllUpcoming() {
    return this.prisma.scheduledRide.findMany({
      where: {
        status: 'OPEN',
        departureAt: ScheduledRideRepository.buildUpcomingDepartureFilter(),
      },
      include: ScheduledRideRepository.buildDefaultInclude(),
      orderBy: { departureAt: 'asc' },
    });
  }

  addPassenger({ scheduledRideId, passengerId, pickupAddress, pickupLat, pickupLng }) {
    return this.prisma.scheduledRidePassenger.create({
      data: {
        scheduledRideId,
        passengerId,
        pickupAddress,
        pickupLat,
        pickupLng,
      },
      include: { passenger: { select: ScheduledRideRepository.PASSENGER_SELECT } },
    });
  }

  findPassenger(scheduledRideId, passengerId) {
    return this.prisma.scheduledRidePassenger.findUnique({
      where: {
        scheduledRideId_passengerId: { scheduledRideId, passengerId },
      },
    });
  }

  removePassenger(scheduledRideId, passengerId) {
    return this.prisma.scheduledRidePassenger.deleteMany({
      where: { scheduledRideId, passengerId },
    });
  }

  markRequested(scheduledRideId, rideId) {
    return this.prisma.scheduledRide.update({
      where: { id: scheduledRideId },
      data: { status: 'REQUESTED', rideId },
      include: ScheduledRideRepository.buildDefaultInclude(),
    });
  }

  cancel(scheduledRideId) {
    return this.prisma.scheduledRide.update({
      where: { id: scheduledRideId },
      data: { status: 'CANCELLED' },
      include: ScheduledRideRepository.buildDefaultInclude(),
    });
  }
}

module.exports = ScheduledRideRepository;
