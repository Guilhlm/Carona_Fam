const RideRepository = require('../repositories/RideRepository');
const config = require('../config/env');
const HttpError = require('../utils/HttpError');
const GeoUtils = require('../utils/GeoUtils');

class RideService {
  static VALID_STATUS_TRANSITIONS = {
    WAITING_DRIVER: ['DRIVER_ACCEPTED', 'CANCELLED'],
    DRIVER_ACCEPTED: ['DRIVER_ARRIVING', 'CANCELLED'],
    DRIVER_ARRIVING: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  static DRIVER_ONLY_TRANSITIONS = new Set(['DRIVER_ARRIVING']);
  static EITHER_PARTY_TRANSITIONS = new Set(['IN_PROGRESS', 'COMPLETED']);

  constructor({ rideRepository, coordinateService, realtimeService }) {
    this.rideRepository = rideRepository;
    this.coordinateService = coordinateService;
    this.realtimeService = realtimeService;
  }

  buildPriceEstimate(distanceKm, timeMin) {
    const { base, perKm, perMin } = config.ridePricing;
    const safeDistanceKm = Number(distanceKm) || 0;
    const safeTimeMin = Number(timeMin) || 0;
    const rawPrice = base + perKm * safeDistanceKm + perMin * safeTimeMin;
    return Math.round(rawPrice * 100) / 100;
  }

  parseAndValidateStops(rawStops) {
    if (!Array.isArray(rawStops)) return [];
    return rawStops.map((rawStop, stopIndex) => {
      const stopLat = GeoUtils.toNumberOrNull(rawStop?.lat);
      const stopLng = GeoUtils.toNumberOrNull(rawStop?.lng);
      const stopAddress = String(rawStop?.address || '').trim();
      if (!stopAddress || !GeoUtils.isValidLatitude(stopLat) || !GeoUtils.isValidLongitude(stopLng)) {
        throw HttpError.badRequest(`Parada ${stopIndex + 1} inválida`);
      }
      return { address: stopAddress, lat: stopLat, lng: stopLng };
    });
  }

  async estimateRouteMetrics(coordinatePoints) {
    let distanceKm = null;
    let estimatedTimeMin = null;
    try {
      if (this.coordinateService && coordinatePoints.length >= 2 && this.coordinateService.apiKey) {
        const routeResponse = await this.coordinateService.calculateCarRoute(coordinatePoints);
        const routeSummary = routeResponse?.features?.[0]?.properties?.summary;
        if (routeSummary) {
          distanceKm = Number((routeSummary.distance / 1000).toFixed(2));
          estimatedTimeMin = Math.ceil(routeSummary.duration / 60);
        }
      }
    } catch (routingError) {
      distanceKm = null;
      estimatedTimeMin = null;
    }

    if (distanceKm == null || estimatedTimeMin == null) {
      const fallbackMetrics = GeoUtils.fallbackDistanceTime(coordinatePoints);
      distanceKm = fallbackMetrics.distanceKm;
      estimatedTimeMin = fallbackMetrics.timeMin;
    }

    return { distanceKm, estimatedTimeMin };
  }

  async requestNewRide(requesterId, requestPayload) {
    const originAddress = (requestPayload.origin || '').trim();
    const destinationAddress = (requestPayload.destination || '').trim();
    if (!originAddress || !destinationAddress) {
      throw HttpError.badRequest('Origem e destino são obrigatórios');
    }

    const originLat = GeoUtils.toNumberOrNull(requestPayload.originLat);
    const originLng = GeoUtils.toNumberOrNull(requestPayload.originLng);
    const destinationLat = GeoUtils.toNumberOrNull(requestPayload.destinationLat);
    const destinationLng = GeoUtils.toNumberOrNull(requestPayload.destinationLng);

    if (!GeoUtils.isValidLatitude(originLat) || !GeoUtils.isValidLongitude(originLng)) {
      throw HttpError.badRequest('Coordenadas de origem inválidas');
    }
    if (!GeoUtils.isValidLatitude(destinationLat) || !GeoUtils.isValidLongitude(destinationLng)) {
      throw HttpError.badRequest('Coordenadas de destino inválidas');
    }

    const parsedStops = this.parseAndValidateStops(requestPayload.stops);

    const existingActiveRide = await this.rideRepository.findActiveRideForUser(requesterId);
    if (existingActiveRide) {
      throw HttpError.conflict('Você já possui uma corrida em andamento', {
        rideId: existingActiveRide.id,
      });
    }

    const coordinatePoints = [
      [originLng, originLat],
      ...parsedStops.map((parsedStop) => [parsedStop.lng, parsedStop.lat]),
      [destinationLng, destinationLat],
    ];

    const { distanceKm, estimatedTimeMin } = await this.estimateRouteMetrics(coordinatePoints);
    const estimatedValue = this.buildPriceEstimate(distanceKm, estimatedTimeMin);

    const createdRide = await this.rideRepository.createRideRequest({
      requesterId,
      origin: originAddress,
      destination: destinationAddress,
      originLat,
      originLng,
      destinationLat,
      destinationLng,
      distanceKm,
      estimatedTimeMin,
      estimatedValue,
      stops: parsedStops,
    });

    this.publishRide(createdRide);
    this.publishOpenRidesEvent({ type: 'created', ride: createdRide });

    return createdRide;
  }

  listOpenRides() {
    return this.rideRepository.findOpenRides();
  }

  async getRideDetail(rideId, currentUser) {
    const rideRecord = await this.rideRepository.findRideDetail(rideId);
    if (!rideRecord) throw HttpError.notFound('Corrida não encontrada');

    const isAdminUser = currentUser?.role === 'ADMIN' || currentUser?.isAdmin === true;
    const isRidePassenger =
      currentUser &&
      (rideRecord.passengers || []).some(
        (passengerLink) =>
          passengerLink.passengerId === currentUser.id && passengerLink.status !== 'CANCELLED'
      );
    const scheduledCaronaLink =
      currentUser && !isRidePassenger
        ? await this.rideRepository.findScheduledCaronaOnRide(rideId, currentUser.id)
        : null;
    const isParticipant =
      currentUser &&
      (rideRecord.requesterId === currentUser.id ||
        rideRecord.driverId === currentUser.id ||
        isRidePassenger ||
        scheduledCaronaLink);
    const isDriverEligible =
      currentUser?.role === 'DRIVER' && rideRecord.status === 'WAITING_DRIVER' && !rideRecord.driverId;

    if (!isAdminUser && !isParticipant && !isDriverEligible) {
      throw HttpError.forbidden('Acesso negado a esta corrida');
    }

    let participationRole = null;
    if (currentUser) {
      if (rideRecord.driverId === currentUser.id) participationRole = 'DRIVER';
      else if (rideRecord.requesterId === currentUser.id) participationRole = 'REQUESTER';
      else if (isRidePassenger || scheduledCaronaLink) participationRole = 'CARONA';
    }

    return participationRole ? { ...rideRecord, participationRole } : rideRecord;
  }

  async resolveDriverVehicle(driverUser, requestedVehicleId) {
    if (!requestedVehicleId) {
      return this.rideRepository.findFirstActiveVehicle(driverUser.id);
    }

    const requestedVehicle = await this.rideRepository.findVehicleByDriver(
      requestedVehicleId,
      driverUser.id
    );

    if (!requestedVehicle) {
      throw HttpError.notFound('Veículo não encontrado ou não pertence ao motorista');
    }
    if (requestedVehicle.isDisabled) {
      throw HttpError.badRequest('Veículo está desabilitado');
    }
    return requestedVehicle;
  }

  async acceptRide(rideId, driverUser, { vehicleId } = {}) {
    if (driverUser.role !== 'DRIVER') {
      throw HttpError.forbidden('Apenas motoristas podem aceitar corridas');
    }

    const rideRecord = await this.rideRepository.findRideById(rideId);
    if (!rideRecord) throw HttpError.notFound('Corrida não encontrada');
    if (rideRecord.status !== 'WAITING_DRIVER' || rideRecord.driverId) {
      throw HttpError.conflict('Corrida não está mais disponível');
    }

    const activeRideForDriver = await this.rideRepository.findActiveRideForUser(driverUser.id);
    if (activeRideForDriver && activeRideForDriver.id !== rideId) {
      throw HttpError.conflict('Você já possui uma corrida em andamento', {
        rideId: activeRideForDriver.id,
      });
    }

    const driverVehicle = await this.resolveDriverVehicle(driverUser, vehicleId);

    const updatedRide = await this.rideRepository.assignDriverToOpenRide(
      rideId,
      driverUser.id,
      driverVehicle ? driverVehicle.id : null
    );

    if (!updatedRide) {
      throw HttpError.conflict('Corrida já foi aceita por outro motorista');
    }

    this.publishRide(updatedRide);
    this.publishOpenRidesEvent({ type: 'accepted', rideId: updatedRide.id });

    return updatedRide;
  }

  async transitionStatus(rideId, currentUser, nextStatus) {
    const rideRecord = await this.rideRepository.findRideById(rideId);
    if (!rideRecord) throw HttpError.notFound('Corrida não encontrada');

    const allowedTransitions = RideService.VALID_STATUS_TRANSITIONS[rideRecord.status] || [];
    if (!allowedTransitions.includes(nextStatus)) {
      throw HttpError.badRequest(`Transição inválida: ${rideRecord.status} -> ${nextStatus}`);
    }

    const isDriver = rideRecord.driverId === currentUser.id;
    const isRequester = rideRecord.requesterId === currentUser.id;
    const isAdminUser = currentUser.role === 'ADMIN' || currentUser.isAdmin === true;

    if (nextStatus === 'CANCELLED') {
      throw HttpError.badRequest('Use o endpoint de cancelamento com motivo');
    }

    if (RideService.DRIVER_ONLY_TRANSITIONS.has(nextStatus)) {
      if (!isDriver && !isAdminUser) {
        throw HttpError.forbidden('Apenas o motorista pode realizar esta ação');
      }
    } else if (RideService.EITHER_PARTY_TRANSITIONS.has(nextStatus)) {
      if (!isDriver && !isRequester && !isAdminUser) {
        throw HttpError.forbidden('Apenas o motorista ou passageiro podem realizar esta ação');
      }
    } else {
      throw HttpError.badRequest('Transição não suportada por este endpoint');
    }

    const transitionMetadata = {};
    if (nextStatus === 'DRIVER_ARRIVING') transitionMetadata.arrivingAt = new Date();
    if (nextStatus === 'IN_PROGRESS') transitionMetadata.startedAt = new Date();
    if (nextStatus === 'COMPLETED') {
      transitionMetadata.completedAt = new Date();
      if (rideRecord.estimatedValue != null && rideRecord.actualValue == null) {
        transitionMetadata.actualValue = rideRecord.estimatedValue;
      }
    }

    const updatedRide = await this.rideRepository.updateRideStatus(rideId, nextStatus, transitionMetadata);
    this.publishRide(updatedRide);
    return updatedRide;
  }

  resolveCancellationActor({ isRequester, isDriver, isAdminUser }) {
    if (isRequester) return 'PASSENGER';
    if (isDriver) return 'DRIVER';
    if (isAdminUser) return 'ADMIN';
    return 'SYSTEM';
  }

  async cancelRide(rideId, currentUser, { reason }) {
    const cancellationReason = String(reason || '').trim();
    if (!cancellationReason) throw HttpError.badRequest('Motivo do cancelamento é obrigatório');

    const rideRecord = await this.rideRepository.findRideById(rideId);
    if (!rideRecord) throw HttpError.notFound('Corrida não encontrada');
    if (!RideRepository.ACTIVE_STATUSES.includes(rideRecord.status)) {
      throw HttpError.badRequest('Corrida não pode mais ser cancelada');
    }

    const isDriver = rideRecord.driverId === currentUser.id;
    const isRequester = rideRecord.requesterId === currentUser.id;
    const isAdminUser = currentUser.role === 'ADMIN' || currentUser.isAdmin === true;

    if (!isDriver && !isRequester && !isAdminUser) {
      throw HttpError.forbidden('Você não pode cancelar esta corrida');
    }

    const cancellationActor = this.resolveCancellationActor({ isRequester, isDriver, isAdminUser });

    const updatedRide = await this.rideRepository.cancelRide(rideId, {
      reason: cancellationReason,
      actor: cancellationActor,
    });
    this.publishRide(updatedRide);
    if (rideRecord.status === 'WAITING_DRIVER') {
      this.publishOpenRidesEvent({ type: 'removed', rideId });
    }
    return updatedRide;
  }

  async getActiveRideForUser(userId) {
    const rideRecord = await this.rideRepository.findActiveRideForUser(userId);
    if (!rideRecord) return null;
    return this.getRideDetail(rideRecord.id, { id: userId });
  }

  async linkCaronaPassenger(rideId, passengerId) {
    const rideRecord = await this.rideRepository.findRideById(rideId);
    if (!rideRecord) throw HttpError.notFound('Corrida não encontrada');
    if (passengerId === rideRecord.requesterId) return;
    await this.rideRepository.createRidePassengerConfirmed(rideId, passengerId);
  }

  publishRide(rideRecord) {
    if (!this.realtimeService || !rideRecord) return;
    this.realtimeService.publish(`ride:${rideRecord.id}`, { ride: rideRecord });
  }

  publishOpenRidesEvent(eventPayload) {
    if (!this.realtimeService) return;
    this.realtimeService.publish('driver:open-rides', eventPayload);
  }

}

module.exports = RideService;
