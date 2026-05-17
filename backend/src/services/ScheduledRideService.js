const HttpError = require('../utils/HttpError');
const GeoUtils = require('../utils/GeoUtils');

const NUMERIC_COORDINATE_FIELDS = [
  'originLat',
  'originLng',
  'destinationLat',
  'destinationLng',
];

const MIN_PASSENGERS = 1;
const MAX_PASSENGERS = 8;
const PAST_TOLERANCE_MS = 60 * 1000;

class ScheduledRideService {
  constructor({ scheduledRideRepository, rideService }) {
    this.scheduledRideRepository = scheduledRideRepository;
    this.rideService = rideService;
  }

  static parseTruthy(rawValue) {
    return rawValue === true || rawValue === 'true' || rawValue === 1 || rawValue === '1';
  }

  serializePassenger(passengerRow) {
    if (!passengerRow) return passengerRow;
    return {
      id: passengerRow.id,
      scheduledRideId: passengerRow.scheduledRideId,
      passengerId: passengerRow.passengerId,
      pickupAddress: passengerRow.pickupAddress,
      pickupLat: GeoUtils.decimalToNumber(passengerRow.pickupLat),
      pickupLng: GeoUtils.decimalToNumber(passengerRow.pickupLng),
      createdAt: passengerRow.createdAt,
      passenger: passengerRow.passenger || null,
    };
  }

  serializeScheduledRide(scheduledRideRow) {
    if (!scheduledRideRow) return scheduledRideRow;
    const serializedRide = { ...scheduledRideRow };
    NUMERIC_COORDINATE_FIELDS.forEach((fieldName) => {
      if (fieldName in serializedRide && serializedRide[fieldName] != null) {
        serializedRide[fieldName] = GeoUtils.decimalToNumber(serializedRide[fieldName]);
      }
    });
    if ('allowNewPassengers' in serializedRide) {
      serializedRide.allowNewPassengers = Boolean(serializedRide.allowNewPassengers);
    }
    if (Array.isArray(serializedRide.joinedPassengers)) {
      serializedRide.joinedPassengers = serializedRide.joinedPassengers.map((passengerRow) =>
        this.serializePassenger(passengerRow)
      );
    }
    return serializedRide;
  }

  async create(creatorUserId, creationPayload) {
    const originAddress = String(creationPayload.origin || '').trim();
    const destinationAddress = String(creationPayload.destination || '').trim();
    if (!originAddress) throw HttpError.badRequest('Local de partida é obrigatório');
    if (!destinationAddress) throw HttpError.badRequest('Destino é obrigatório');

    const originLat = GeoUtils.toNumberOrNull(creationPayload.originLat);
    const originLng = GeoUtils.toNumberOrNull(creationPayload.originLng);
    const destinationLat = GeoUtils.toNumberOrNull(creationPayload.destinationLat);
    const destinationLng = GeoUtils.toNumberOrNull(creationPayload.destinationLng);

    if (!GeoUtils.isValidLatitude(originLat) || !GeoUtils.isValidLongitude(originLng)) {
      throw HttpError.badRequest('Coordenadas de partida inválidas');
    }
    if (!GeoUtils.isValidLatitude(destinationLat) || !GeoUtils.isValidLongitude(destinationLng)) {
      throw HttpError.badRequest('Coordenadas de destino inválidas');
    }

    const departureAt = new Date(creationPayload.departureAt);
    if (Number.isNaN(departureAt.getTime())) throw HttpError.badRequest('Data de saída inválida');
    if (departureAt.getTime() < Date.now() - PAST_TOLERANCE_MS) {
      throw HttpError.badRequest('A saída não pode ser no passado');
    }

    const passengersCount = Math.min(
      MAX_PASSENGERS,
      Math.max(MIN_PASSENGERS, parseInt(creationPayload.passengers, 10) || MIN_PASSENGERS)
    );
    const allowNewPassengers = ScheduledRideService.parseTruthy(creationPayload.allowNewPassengers);

    const createdScheduled = await this.scheduledRideRepository.create({
      creatorId: creatorUserId,
      origin: originAddress,
      destination: destinationAddress,
      originLat,
      originLng,
      destinationLat,
      destinationLng,
      departureAt,
      passengers: passengersCount,
      allowNewPassengers,
    });

    return this.serializeScheduledRide(createdScheduled);
  }

  async listMine(creatorUserId) {
    const scheduledRows = await this.scheduledRideRepository.findMine(creatorUserId);
    return scheduledRows.map((scheduledRow) => this.serializeScheduledRide(scheduledRow));
  }

  async listJoined(userId) {
    const scheduledRows = await this.scheduledRideRepository.findJoinedByPassenger(userId);
    return scheduledRows.map((scheduledRow) => this.serializeScheduledRide(scheduledRow));
  }

  async listOpen(userId) {
    const scheduledRows = await this.scheduledRideRepository.findOpenForCommunity(userId);
    return scheduledRows.map((scheduledRow) => this.serializeScheduledRide(scheduledRow));
  }

  async listAll() {
    const scheduledRows = await this.scheduledRideRepository.findAllUpcoming();
    return scheduledRows.map((scheduledRow) => this.serializeScheduledRide(scheduledRow));
  }

  async getDetail(scheduledRideId) {
    const scheduledRow = await this.scheduledRideRepository.findById(scheduledRideId);
    if (!scheduledRow) throw HttpError.notFound('Viagem agendada não encontrada');
    return this.serializeScheduledRide(scheduledRow);
  }

  async joinAsCarona(scheduledRideId, userId, joinPayload) {
    const scheduledRow = await this.scheduledRideRepository.findById(scheduledRideId);
    if (!scheduledRow) throw HttpError.notFound('Viagem agendada não encontrada');
    if (scheduledRow.creatorId === userId) {
      throw HttpError.conflict('Você é o criador desta viagem');
    }
    if (scheduledRow.status !== 'OPEN') {
      throw HttpError.badRequest('Esta viagem não está mais aceitando carona');
    }
    if (!scheduledRow.allowNewPassengers) {
      throw HttpError.badRequest('Esta viagem não aceita novos passageiros');
    }
    if (scheduledRow.ride && scheduledRow.ride.status && scheduledRow.ride.status !== 'WAITING_DRIVER') {
      throw HttpError.badRequest(
        'Motorista já aceitou esta corrida; não é possível entrar como carona'
      );
    }

    const pickupAddress = String(joinPayload?.pickupAddress || '').trim();
    const pickupLat = GeoUtils.toNumberOrNull(joinPayload?.pickupLat);
    const pickupLng = GeoUtils.toNumberOrNull(joinPayload?.pickupLng);

    if (!pickupAddress) throw HttpError.badRequest('Endereço de embarque é obrigatório');
    if (!GeoUtils.isValidLatitude(pickupLat) || !GeoUtils.isValidLongitude(pickupLng)) {
      throw HttpError.badRequest('Coordenadas de embarque inválidas');
    }

    const existingPassenger = await this.scheduledRideRepository.findPassenger(
      scheduledRideId,
      userId
    );
    if (existingPassenger) {
      throw HttpError.conflict('Você já está participando desta viagem como carona');
    }

    await this.scheduledRideRepository.addPassenger({
      scheduledRideId,
      passengerId: userId,
      pickupAddress,
      pickupLat,
      pickupLng,
    });

    const refreshedRow = await this.scheduledRideRepository.findById(scheduledRideId);
    return this.serializeScheduledRide(refreshedRow);
  }

  async leaveCarona(scheduledRideId, userId) {
    const scheduledRow = await this.scheduledRideRepository.findById(scheduledRideId);
    if (!scheduledRow) throw HttpError.notFound('Viagem agendada não encontrada');

    if (scheduledRow.status !== 'OPEN') {
      throw HttpError.badRequest('Não é possível sair: a corrida já foi solicitada');
    }

    const existingPassenger = await this.scheduledRideRepository.findPassenger(
      scheduledRideId,
      userId
    );
    if (!existingPassenger) throw HttpError.notFound('Você não está como carona nesta viagem');

    await this.scheduledRideRepository.removePassenger(scheduledRideId, userId);
    const refreshedRow = await this.scheduledRideRepository.findById(scheduledRideId);
    return this.serializeScheduledRide(refreshedRow);
  }

  async convertToRide(scheduledRideId, creatorUserId) {
    if (!this.rideService) {
      throw HttpError.internal('Serviço de corridas indisponível');
    }

    const scheduledRow = await this.scheduledRideRepository.findById(scheduledRideId);
    if (!scheduledRow) throw HttpError.notFound('Viagem agendada não encontrada');
    if (scheduledRow.creatorId !== creatorUserId) {
      throw HttpError.forbidden('Apenas o criador pode solicitar esta viagem');
    }
    if (scheduledRow.status !== 'OPEN') {
      throw HttpError.badRequest('Esta viagem já foi solicitada ou cancelada');
    }

    const originLat = GeoUtils.decimalToNumber(scheduledRow.originLat);
    const originLng = GeoUtils.decimalToNumber(scheduledRow.originLng);
    const destinationLat = GeoUtils.decimalToNumber(scheduledRow.destinationLat);
    const destinationLng = GeoUtils.decimalToNumber(scheduledRow.destinationLng);

    if (!GeoUtils.isValidLatitude(originLat) || !GeoUtils.isValidLongitude(originLng)) {
      throw HttpError.badRequest('Endereço de origem inválido na viagem agendada');
    }
    if (!GeoUtils.isValidLatitude(destinationLat) || !GeoUtils.isValidLongitude(destinationLng)) {
      throw HttpError.badRequest('Endereço de destino inválido na viagem agendada');
    }

    const pickupStops = (scheduledRow.joinedPassengers || []).map((passengerRow) => ({
      address: passengerRow.pickupAddress,
      lat: GeoUtils.decimalToNumber(passengerRow.pickupLat),
      lng: GeoUtils.decimalToNumber(passengerRow.pickupLng),
    }));

    const createdRide = await this.rideService.requestNewRide(creatorUserId, {
      origin: scheduledRow.origin || scheduledRow.destination,
      originLat,
      originLng,
      destination: scheduledRow.destination,
      destinationLat,
      destinationLng,
      stops: pickupStops,
    });

    const joinedPassengersList = scheduledRow.joinedPassengers || [];
    for (const passengerRow of joinedPassengersList) {
      if (passengerRow.passengerId) {
        await this.rideService.linkCaronaPassenger(createdRide.id, passengerRow.passengerId);
      }
    }

    await this.scheduledRideRepository.markRequested(scheduledRideId, createdRide.id);

    const rideDetail = await this.rideService.getRideDetail(createdRide.id, { id: creatorUserId });
    this.rideService.publishRide(rideDetail);
    return rideDetail;
  }

  async cancel(scheduledRideId, creatorUserId) {
    const scheduledRow = await this.scheduledRideRepository.findById(scheduledRideId);
    if (!scheduledRow) throw HttpError.notFound('Viagem agendada não encontrada');
    if (scheduledRow.creatorId !== creatorUserId) {
      throw HttpError.forbidden('Apenas o criador pode excluir esta viagem');
    }
    if (scheduledRow.status !== 'OPEN') {
      throw HttpError.badRequest('Só é possível excluir viagens que ainda não foram solicitadas');
    }

    await this.scheduledRideRepository.cancel(scheduledRideId);
    return { success: true };
  }
}

module.exports = ScheduledRideService;
