const HttpError = require('../utils/HttpError');
const GeoUtils = require('../utils/GeoUtils');

class LegacyRideService {
  constructor({ rideRepository }) {
    this.rideRepository = rideRepository;
  }

  buildOrderByClause(orderingKey) {
    if (orderingKey === 'passengers_desc') return { passengers: { _count: 'desc' } };
    if (orderingKey === 'driver_asc') return { driver: { name: 'asc' } };
    if (orderingKey === 'passenger_asc') return null;
    if (orderingKey === 'date_desc') return { requestedAt: 'desc' };
    return { requestedAt: 'desc' };
  }

  buildRideFilter({ status, origin, destination, search }) {
    const whereClause = {};
    if (status) whereClause.status = status;

    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereClause.OR = [
        { origin: { contains: searchTerm, mode: 'insensitive' } },
        { destination: { contains: searchTerm, mode: 'insensitive' } },
        { driver: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { requester: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { passengers: { some: { passenger: { name: { contains: searchTerm, mode: 'insensitive' } } } } },
      ];
      return whereClause;
    }

    if (origin) whereClause.origin = { contains: origin, mode: 'insensitive' };
    if (destination) whereClause.destination = { contains: destination, mode: 'insensitive' };
    return whereClause;
  }

  buildAdminRideInclude() {
    return {
      requester: { select: { id: true, name: true } },
      driver: { select: { id: true, name: true, email: true } },
      vehicle: { select: { brand: true, model: true, plate: true } },
      stops: { orderBy: { ordering: 'asc' } },
      passengers: {
        include: { passenger: { select: { id: true, name: true } } },
      },
    };
  }

  async listRides(filters = {}) {
    const pageNumber = Math.max(1, parseInt(filters.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 20));
    const { status, origin, destination, search, order } = filters;
    const skipCount = (pageNumber - 1) * pageSize;

    const whereClause = this.buildRideFilter({ status, origin, destination, search });
    const includeClause = this.buildAdminRideInclude();

    if (order === 'passenger_asc') {
      const [allRides, totalCount] = await this.rideRepository.listRides(whereClause, includeClause, {
        orderBy: { requestedAt: 'desc' },
      });

      const sortedRides = [...allRides].sort((rideA, rideB) => {
        const passengerNameA = rideA.passengers?.[0]?.passenger?.name ?? rideA.requester?.name ?? '';
        const passengerNameB = rideB.passengers?.[0]?.passenger?.name ?? rideB.requester?.name ?? '';
        return String(passengerNameA).localeCompare(String(passengerNameB));
      });
      const paginatedRides = sortedRides.slice(skipCount, skipCount + pageSize);

      return {
        data: paginatedRides,
        pagination: {
          page: pageNumber,
          limit: pageSize,
          total: totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      };
    }

    const [paginatedRides, totalCount] = await this.rideRepository.listRides(whereClause, includeClause, {
      skip: skipCount,
      take: pageSize,
      orderBy: this.buildOrderByClause(order),
    });

    return {
      data: paginatedRides,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }

  getRideHistory(userId, role) {
    return this.rideRepository.findRideHistoryByUser(userId, role);
  }

  async createRide(driverUserId, creationPayload) {
    const driverRecord = await this.rideRepository.findDriverById(driverUserId);
    if (!driverRecord) throw HttpError.forbidden('Apenas motoristas podem criar corridas');

    const driverVehicle = await this.rideRepository.findVehicleByDriver(
      creationPayload.vehicleId,
      driverUserId
    );
    if (!driverVehicle) throw HttpError.notFound('Veículo não encontrado ou não pertence ao motorista');

    return this.rideRepository.createRideRequest({
      requesterId: driverUserId,
      origin: creationPayload.origin,
      destination: creationPayload.destination,
      originLat: GeoUtils.toNumberOrNull(creationPayload.originLat),
      originLng: GeoUtils.toNumberOrNull(creationPayload.originLng),
      destinationLat: GeoUtils.toNumberOrNull(creationPayload.destinationLat),
      destinationLng: GeoUtils.toNumberOrNull(creationPayload.destinationLng),
      distanceKm: creationPayload.distanceKm ? parseFloat(creationPayload.distanceKm) : null,
      estimatedTimeMin: creationPayload.estimatedTimeMin
        ? parseInt(creationPayload.estimatedTimeMin, 10)
        : null,
      estimatedValue: creationPayload.suggestedValue
        ? parseFloat(creationPayload.suggestedValue)
        : null,
      stops: [],
    });
  }

  async requestRide(rideId, passengerId) {
    const rideRecord = await this.rideRepository.findRideWithPassengers(rideId);
    if (!rideRecord) throw HttpError.notFound('Corrida não encontrada');
    if (rideRecord.status !== 'WAITING_DRIVER' && rideRecord.status !== 'DRIVER_ACCEPTED') {
      throw HttpError.badRequest('Corrida não está disponível');
    }

    const confirmedPassengersCount = rideRecord.passengers.filter(
      (passengerLink) => passengerLink.status === 'CONFIRMED'
    ).length;
    if (confirmedPassengersCount >= rideRecord.availableSeats) {
      throw HttpError.badRequest('Não há vagas disponíveis');
    }

    const existingRequest = rideRecord.passengers.find(
      (passengerLink) => passengerLink.passengerId === passengerId
    );
    if (existingRequest) throw HttpError.conflict('Solicitação já realizada');

    return this.rideRepository.createRidePassengerRequest(rideId, passengerId);
  }
}

module.exports = LegacyRideService;
