const InputNormalizer = require('../../utils/InputNormalizer');
const HttpError = require('../../utils/HttpError');
const GeoUtils = require('../../utils/GeoUtils');

class AdminApplicationService {
  constructor({
    userRepository,
    vehicleRepository,
    reviewRepository,
    rideRepository,
    hashPassword,
  }) {
    this.userRepository = userRepository;
    this.vehicleRepository = vehicleRepository;
    this.reviewRepository = reviewRepository;
    this.rideRepository = rideRepository;
    this.hashPassword = hashPassword;
  }

  serializeRide(rideRecord) {
    if (!rideRecord) return rideRecord;
    const numericFieldNames = [
      'distanceKm',
      'estimatedValue',
      'actualValue',
      'originLat',
      'originLng',
      'destinationLat',
      'destinationLng',
    ];
    const serializedRide = { ...rideRecord };
    numericFieldNames.forEach((fieldName) => {
      if (fieldName in serializedRide) {
        serializedRide[fieldName] = GeoUtils.decimalToNumber(serializedRide[fieldName]);
      }
    });
    if (Array.isArray(serializedRide.stops)) {
      serializedRide.stops = serializedRide.stops.map((stopRecord) => ({
        ...stopRecord,
        lat: GeoUtils.decimalToNumber(stopRecord.lat),
        lng: GeoUtils.decimalToNumber(stopRecord.lng),
      }));
    }
    return serializedRide;
  }

  listUsers(filters) {
    return this.userRepository.listUsers(filters);
  }

  listDrivers(filters) {
    return this.userRepository.listDrivers(filters);
  }

  listVehicles(filters) {
    return this.vehicleRepository.listVehicles(filters);
  }

  listReviews(filters) {
    return this.reviewRepository.listReviews(filters);
  }

  async listRides(filters) {
    const result = await this.rideRepository.listRides(filters);
    return {
      data: Array.isArray(result.data)
        ? result.data.map((ride) => this.serializeRide(ride))
        : result.data,
      pagination: result.pagination,
    };
  }

  async cancelRide(rideId) {
    const rideRecord = await this.rideRepository.findById(rideId);
    if (!rideRecord) {
      throw HttpError.notFound('Corrida não encontrada');
    }

    if (rideRecord.status === 'CANCELLED') {
      throw HttpError.badRequest('Corrida já está cancelada');
    }

    return this.rideRepository.cancelRide(rideId);
  }

  async blockUser(userId, shouldBlock = true, currentUserId, blockReason) {
    const targetUser = await this.userRepository.findById(userId);

    if (!targetUser) {
      throw HttpError.notFound('Usuário não encontrado');
    }

    if (currentUserId && targetUser.id === currentUserId) {
      throw HttpError.badRequest('Você não pode bloquear a própria conta');
    }

    const updatePayload = { isBlocked: shouldBlock };
    if (shouldBlock && blockReason != null && blockReason !== '') {
      updatePayload.blockReason = blockReason;
    } else if (!shouldBlock) {
      updatePayload.blockReason = null;
    }

    return this.userRepository.updateBlockStatus(userId, updatePayload);
  }

  async createUser(creationPayload) {
    const {
      email,
      password,
      name,
      ra,
      course,
      gender,
      age,
      phone,
      cep,
      role,
      isAdmin,
    } = creationPayload;

    const normalizedEmail = InputNormalizer.normalizeEmail(email);
    const normalizedRa = InputNormalizer.normalizeDigits(ra, 20);
    const rawPassword = String(password || '');

    if (!normalizedEmail || !InputNormalizer.isValidEmail(normalizedEmail)) {
      throw HttpError.badRequest('Informe um e-mail válido');
    }

    if (!InputNormalizer.isStrongPassword(rawPassword)) {
      throw HttpError.badRequest(
        `Senha deve ter ao menos ${InputNormalizer.MIN_PASSWORD_LENGTH} caracteres, incluindo letras e números`
      );
    }

    const existingByEmail = await this.userRepository.findByEmail(normalizedEmail);
    if (existingByEmail) {
      throw HttpError.conflict('Email já cadastrado');
    }

    if (normalizedRa) {
      const existingByRa = await this.userRepository.findByRa(normalizedRa);
      if (existingByRa) {
        throw HttpError.conflict('RA já cadastrado');
      }
    }

    const passwordHash = await this.hashPassword(rawPassword);
    const resolvedRole = role || 'USER';

    return this.userRepository.create({
      email: normalizedEmail,
      passwordHash,
      name: InputNormalizer.normalizeOptionalString(name) || normalizedEmail.split('@')[0],
      ra: normalizedRa || null,
      course: InputNormalizer.normalizeOptionalString(course),
      gender: InputNormalizer.normalizeOptionalString(gender),
      age: age ? parseInt(age, 10) : null,
      phone: InputNormalizer.normalizeDigits(phone, 15) || null,
      cep: InputNormalizer.normalizeDigits(cep, 8) || null,
      role: resolvedRole,
      isAdmin: !!isAdmin,
    });
  }

  async getUser(userId) {
    const userRecord = await this.userRepository.getDetailsById(userId);

    if (!userRecord) {
      throw HttpError.notFound('Usuário não encontrado');
    }

    return userRecord;
  }

  async updateUser(userId, updatePayload, currentUserId) {
    const targetUser = await this.userRepository.findById(userId);

    if (!targetUser) {
      throw HttpError.notFound('Usuário não encontrado');
    }

    const wasAdminUser = targetUser.role === 'ADMIN' || targetUser.isAdmin;
    const willBeAdmin =
      typeof updatePayload.role !== 'undefined' || typeof updatePayload.isAdmin !== 'undefined'
        ? (updatePayload.role || targetUser.role) === 'ADMIN' || !!(updatePayload.isAdmin ?? targetUser.isAdmin)
        : wasAdminUser;

    if (willBeAdmin && !wasAdminUser && targetUser.isBlocked) {
      throw HttpError.badRequest('Não é possível tornar administrador um usuário bloqueado');
    }

    if (wasAdminUser && !willBeAdmin) {
      if (targetUser.id === currentUserId) {
        throw HttpError.badRequest('Você não pode remover suas próprias permissões de administrador');
      }

      const otherAdminsCount = await this.userRepository.countOtherAdmins(targetUser.id);
      if (otherAdminsCount === 0) {
        throw HttpError.badRequest('Não é possível remover o último administrador');
      }
    }

    if (typeof updatePayload.isBlocked !== 'undefined' && wasAdminUser) {
      throw HttpError.forbidden('Não é possível bloquear administradores');
    }

    const normalizedUpdateEmail =
      typeof updatePayload.email === 'undefined' ? undefined : InputNormalizer.normalizeEmail(updatePayload.email);
    const normalizedUpdateRa =
      typeof updatePayload.ra === 'undefined' ? undefined : InputNormalizer.normalizeDigits(updatePayload.ra, 20);

    if (
      normalizedUpdateEmail &&
      (!InputNormalizer.isValidEmail(normalizedUpdateEmail) || normalizedUpdateEmail !== targetUser.email)
    ) {
      const existingByEmail = await this.userRepository.findByEmail(normalizedUpdateEmail);
      if (existingByEmail && existingByEmail.id !== targetUser.id) {
        throw HttpError.conflict('Email já cadastrado');
      }
    }

    if (
      typeof normalizedUpdateRa !== 'undefined' &&
      normalizedUpdateRa !== targetUser.ra &&
      normalizedUpdateRa !== null
    ) {
      const existingByRa = await this.userRepository.findByRa(normalizedUpdateRa);
      if (existingByRa && existingByRa.id !== targetUser.id) {
        throw HttpError.conflict('RA já cadastrado');
      }
    }

    const persistedPayload = {};
    if (typeof updatePayload.name !== 'undefined') {
      persistedPayload.name = InputNormalizer.normalizeOptionalString(updatePayload.name);
    }
    if (typeof updatePayload.email !== 'undefined') {
      if (normalizedUpdateEmail && !InputNormalizer.isValidEmail(normalizedUpdateEmail)) {
        throw HttpError.badRequest('Informe um e-mail válido');
      }
      persistedPayload.email = normalizedUpdateEmail || null;
    }
    if (typeof updatePayload.ra !== 'undefined') persistedPayload.ra = normalizedUpdateRa || null;
    if (typeof updatePayload.course !== 'undefined') {
      persistedPayload.course = InputNormalizer.normalizeOptionalString(updatePayload.course);
    }
    if (typeof updatePayload.gender !== 'undefined') {
      persistedPayload.gender = InputNormalizer.normalizeOptionalString(updatePayload.gender);
    }
    if (typeof updatePayload.age !== 'undefined') {
      persistedPayload.age = updatePayload.age === null || updatePayload.age === ''
        ? null
        : parseInt(updatePayload.age, 10);
    }
    if (typeof updatePayload.phone !== 'undefined') {
      persistedPayload.phone = InputNormalizer.normalizeDigits(updatePayload.phone, 15) || null;
    }
    if (typeof updatePayload.cep !== 'undefined') {
      persistedPayload.cep = InputNormalizer.normalizeDigits(updatePayload.cep, 8) || null;
    }
    if (typeof updatePayload.role !== 'undefined') persistedPayload.role = updatePayload.role;
    if (typeof updatePayload.isAdmin !== 'undefined') persistedPayload.isAdmin = !!updatePayload.isAdmin;
    if (typeof updatePayload.isBlocked !== 'undefined') persistedPayload.isBlocked = !!updatePayload.isBlocked;

    return this.userRepository.updateById(userId, persistedPayload);
  }

  async deleteUser(userId) {
    const targetUser = await this.userRepository.findById(userId);

    if (!targetUser) {
      throw HttpError.notFound('Usuário não encontrado');
    }

    if (targetUser.role === 'ADMIN' || targetUser.isAdmin) {
      throw HttpError.forbidden('Não é possível excluir administradores');
    }

    await this.userRepository.deleteById(userId);
    return { success: true };
  }

  async disableVehicle(vehicleId, shouldDisable = true, disabledReason) {
    const vehicleRecord = await this.vehicleRepository.findById(vehicleId);
    if (!vehicleRecord) {
      throw HttpError.notFound('Veículo não encontrado');
    }

    const updatePayload = { isDisabled: !!shouldDisable };
    if (shouldDisable && disabledReason != null && disabledReason !== '') {
      updatePayload.disabledReason = disabledReason;
    } else if (!shouldDisable) {
      updatePayload.disabledReason = null;
    }

    return this.vehicleRepository.updateDisableStatus(vehicleId, updatePayload);
  }

  async disableReview(reviewId, shouldDisable = true, disabledReason) {
    const reviewRecord = await this.reviewRepository.findById(reviewId);
    if (!reviewRecord) {
      throw HttpError.notFound('Avaliação não encontrada');
    }

    const updatePayload = { isDisabled: !!shouldDisable };
    if (shouldDisable && disabledReason != null && disabledReason !== '') {
      updatePayload.disabledReason = disabledReason;
    } else if (!shouldDisable) {
      updatePayload.disabledReason = null;
    }

    return this.reviewRepository.updateDisableStatus(reviewId, updatePayload);
  }
}

module.exports = AdminApplicationService;
