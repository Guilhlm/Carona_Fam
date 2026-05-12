class RideService {
  constructor({ rideRepository }) {
    this.rideRepository = rideRepository;
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
    return { departureAt: 'asc' };
  }

  buildRideFilter({ status, origin, destination, search }) {
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
      return where;
    }

    if (origin) {
      where.origin = { contains: origin, mode: 'insensitive' };
    }
    if (destination) {
      where.destination = { contains: destination, mode: 'insensitive' };
    }

    return where;
  }

  getRideInclude() {
    return {
      driver: { select: { id: true, name: true, email: true } },
      vehicle: { select: { brand: true, model: true, plate: true } },
      passengers: {
        include: {
          passenger: { select: { id: true, name: true } },
        },
      },
    };
  }

  async listRides(filters = {}) {
    const pageNumber = Math.max(1, parseInt(filters.page, 10) || 1);
    const limitNumber = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 20));
    const { status, origin, destination, search, order } = filters;
    const skip = (pageNumber - 1) * limitNumber;

    const where = this.buildRideFilter({ status, origin, destination, search });
    const include = this.getRideInclude();

    if (order === 'passenger_asc') {
      const [allRides, total] = await this.rideRepository.listRides(where, include, {
        orderBy: { departureAt: 'asc' },
      });

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

    const [rides, total] = await this.rideRepository.listRides(where, include, {
      skip,
      take: limitNumber,
      orderBy: this.getOrderBy(order),
    });

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

  getRideHistory(userId, role) {
    return this.rideRepository.findRideHistoryByUser(userId, role);
  }

  async createRide(userId, data) {
    const driver = await this.rideRepository.findDriverById(userId);
    if (!driver) {
      const err = new Error('Apenas motoristas podem criar corridas');
      err.statusCode = 403;
      throw err;
    }

    const vehicle = await this.rideRepository.findVehicleByDriver(data.vehicleId, userId);
    if (!vehicle) {
      const err = new Error('Veículo não encontrado ou não pertence ao motorista');
      err.statusCode = 404;
      throw err;
    }

    return this.rideRepository.createRide({
      driverId: userId,
      vehicleId: data.vehicleId,
      origin: data.origin,
      destination: data.destination,
      distanceKm: data.distanceKm ? parseFloat(data.distanceKm) : null,
      suggestedValue: data.suggestedValue ? parseFloat(data.suggestedValue) : null,
      departureAt: new Date(data.departureAt),
      arrivalAt: new Date(data.arrivalAt),
      availableSeats: parseInt(data.availableSeats, 10) || 1,
    });
  }

  async requestRide(rideId, passengerId) {
    const ride = await this.rideRepository.findRideWithPassengers(rideId);

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

    const confirmedCount = ride.passengers.filter((passenger) => passenger.status === 'CONFIRMED').length;
    if (confirmedCount >= ride.availableSeats) {
      const err = new Error('Não há vagas disponíveis');
      err.statusCode = 400;
      throw err;
    }

    const existing = ride.passengers.find((passenger) => passenger.passengerId === passengerId);
    if (existing) {
      const err = new Error('Solicitação já realizada');
      err.statusCode = 409;
      throw err;
    }

    return this.rideRepository.createRideRequest(rideId, passengerId);
  }

  async updateRideStatus(rideId, userId, status) {
    const ride = await this.rideRepository.findRideById(rideId);
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

    return this.rideRepository.updateRideStatus(rideId, status);
  }

  async cancelRideByAdmin(rideId) {
    const ride = await this.rideRepository.findRideById(rideId);

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

    return this.rideRepository.updateRideStatus(rideId, 'CANCELLED');
  }
}

module.exports = RideService;
