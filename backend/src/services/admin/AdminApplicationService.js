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

  serializeRide(ride) {
    if (!ride) return ride;
    const { distanceKm, suggestedValue, ...rest } = ride;
    return {
      ...rest,
      distanceKm:
        distanceKm != null &&
        typeof distanceKm === 'object' &&
        typeof distanceKm.toNumber === 'function'
          ? distanceKm.toNumber()
          : distanceKm != null
            ? Number(distanceKm)
            : null,
      suggestedValue:
        suggestedValue != null &&
        typeof suggestedValue === 'object' &&
        typeof suggestedValue.toNumber === 'function'
          ? suggestedValue.toNumber()
          : suggestedValue != null
            ? Number(suggestedValue)
            : null,
    };
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
    const ride = await this.rideRepository.findById(rideId);
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

    return this.rideRepository.cancelRide(rideId);
  }

  async blockUser(userId, block = true, currentUserId, blockReason) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      const err = new Error('Usuário não encontrado');
      err.statusCode = 404;
      throw err;
    }

    if (currentUserId && user.id === currentUserId) {
      const err = new Error('Você não pode bloquear a própria conta');
      err.statusCode = 400;
      throw err;
    }

    const updatePayload = { isBlocked: block };
    if (block && blockReason != null && blockReason !== '') {
      updatePayload.blockReason = blockReason;
    } else if (!block) {
      updatePayload.blockReason = null;
    }

    return this.userRepository.updateBlockStatus(userId, updatePayload);
  }

  async createUser(data) {
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
    } = data;

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      const err = new Error('Email já cadastrado');
      err.statusCode = 409;
      throw err;
    }

    if (ra) {
      const existingRa = await this.userRepository.findByRa(ra);
      if (existingRa) {
        const err = new Error('RA já cadastrado');
        err.statusCode = 409;
        throw err;
      }
    }

    const passwordHash = await this.hashPassword(password || email);
    const userRole = role || 'USER';

    return this.userRepository.create({
      email,
      passwordHash,
      name: name || email.split('@')[0],
      ra: ra || null,
      course: course || null,
      gender: gender || null,
      age: age ? parseInt(age, 10) : null,
      phone: phone || null,
      cep: cep || null,
      role: userRole,
      isAdmin: !!isAdmin,
    });
  }

  async getUser(userId) {
    const user = await this.userRepository.getDetailsById(userId);

    if (!user) {
      const err = new Error('Usuário não encontrado');
      err.statusCode = 404;
      throw err;
    }

    return user;
  }

  async updateUser(userId, data, currentUserId) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      const err = new Error('Usuário não encontrado');
      err.statusCode = 404;
      throw err;
    }

    const isAdminUser = user.role === 'ADMIN' || user.isAdmin;
    const willBeAdmin =
      typeof data.role !== 'undefined' || typeof data.isAdmin !== 'undefined'
        ? (data.role || user.role) === 'ADMIN' || !!(data.isAdmin ?? user.isAdmin)
        : isAdminUser;

    if (willBeAdmin && !isAdminUser && user.isBlocked) {
      const err = new Error('Não é possível tornar administrador um usuário bloqueado');
      err.statusCode = 400;
      throw err;
    }

    if (isAdminUser && !willBeAdmin) {
      if (user.id === currentUserId) {
        const err = new Error('Você não pode remover suas próprias permissões de administrador');
        err.statusCode = 400;
        throw err;
      }

      const otherAdmins = await this.userRepository.countOtherAdmins(user.id);
      if (otherAdmins === 0) {
        const err = new Error('Não é possível remover o último administrador');
        err.statusCode = 400;
        throw err;
      }
    }

    if (typeof data.isBlocked !== 'undefined' && isAdminUser) {
      const err = new Error('Não é possível bloquear administradores');
      err.statusCode = 403;
      throw err;
    }

    if (data.email && data.email !== user.email) {
      const existingEmail = await this.userRepository.findByEmail(data.email);
      if (existingEmail && existingEmail.id !== user.id) {
        const err = new Error('Email já cadastrado');
        err.statusCode = 409;
        throw err;
      }
    }

    if (typeof data.ra !== 'undefined' && data.ra !== user.ra && data.ra !== null) {
      const existingRa = await this.userRepository.findByRa(data.ra);
      if (existingRa && existingRa.id !== user.id) {
        const err = new Error('RA já cadastrado');
        err.statusCode = 409;
        throw err;
      }
    }

    const updateData = {};
    if (typeof data.name !== 'undefined') updateData.name = data.name;
    if (typeof data.email !== 'undefined') updateData.email = data.email;
    if (typeof data.ra !== 'undefined') updateData.ra = data.ra || null;
    if (typeof data.course !== 'undefined') updateData.course = data.course || null;
    if (typeof data.gender !== 'undefined') updateData.gender = data.gender || null;
    if (typeof data.age !== 'undefined') {
      updateData.age = data.age === null || data.age === '' ? null : parseInt(data.age, 10);
    }
    if (typeof data.phone !== 'undefined') updateData.phone = data.phone || null;
    if (typeof data.cep !== 'undefined') updateData.cep = data.cep || null;
    if (typeof data.role !== 'undefined') updateData.role = data.role;
    if (typeof data.isAdmin !== 'undefined') updateData.isAdmin = !!data.isAdmin;
    if (typeof data.isBlocked !== 'undefined') updateData.isBlocked = !!data.isBlocked;

    return this.userRepository.updateById(userId, updateData);
  }

  async deleteUser(userId) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      const err = new Error('Usuário não encontrado');
      err.statusCode = 404;
      throw err;
    }

    if (user.role === 'ADMIN' || user.isAdmin) {
      const err = new Error('Não é possível excluir administradores');
      err.statusCode = 403;
      throw err;
    }

    await this.userRepository.deleteById(userId);
    return { success: true };
  }

  async disableVehicle(vehicleId, disable = true, disabledReason) {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    if (!vehicle) {
      const err = new Error('Veículo não encontrado');
      err.statusCode = 404;
      throw err;
    }

    const updatePayload = { isDisabled: !!disable };
    if (disable && disabledReason != null && disabledReason !== '') {
      updatePayload.disabledReason = disabledReason;
    } else if (!disable) {
      updatePayload.disabledReason = null;
    }

    return this.vehicleRepository.updateDisableStatus(vehicleId, updatePayload);
  }

  async disableReview(reviewId, disable = true, disabledReason) {
    const review = await this.reviewRepository.findById(reviewId);
    if (!review) {
      const err = new Error('Avaliação não encontrada');
      err.statusCode = 404;
      throw err;
    }

    const updatePayload = { isDisabled: !!disable };
    if (disable && disabledReason != null && disabledReason !== '') {
      updatePayload.disabledReason = disabledReason;
    } else if (!disable) {
      updatePayload.disabledReason = null;
    }

    return this.reviewRepository.updateDisableStatus(reviewId, updatePayload);
  }
}

module.exports = AdminApplicationService;
