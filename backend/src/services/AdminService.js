const { prisma } = require('../config/database');
const { hashPassword } = require('../utils/password');

async function listUsers(filters = {}) {
  const { page = 1, limit = 20, isBlocked, role, search } = filters;
  const pageNumber = parseInt(page, 10) || 1;
  const limitNumber = parseInt(limit, 10) || 20;
  const skip = (pageNumber - 1) * limitNumber;

  const andConditions = [];

  if (typeof isBlocked === 'boolean') {
    andConditions.push({ isBlocked });
  }

  if (role === 'ADMIN') {
    andConditions.push({
      OR: [{ role: 'ADMIN' }, { isAdmin: true }],
    });
  } else if (role) {
    andConditions.push({ role });
  }

  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { ra: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  const where = andConditions.length ? { AND: andConditions } : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        ra: true,
        role: true,
        isAdmin: true,
        isBlocked: true,
        createdAt: true,
      },
      skip,
      take: limitNumber,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
}

async function blockUser(userId, block = true, currentUserId, blockReason) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

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
  const updated = await prisma.user.update({
    where: { id: userId },
    data: updatePayload,
    select: {
      id: true,
      name: true,
      email: true,
      isBlocked: true,
      blockReason: true,
    },
  });

  return updated;
}

async function createUser(data) {
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

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (existing) {
    const err = new Error('Email já cadastrado');
    err.statusCode = 409;
    throw err;
  }

  if (ra) {
    const existingRa = await prisma.user.findUnique({
      where: { ra },
    });
    if (existingRa) {
      const err = new Error('RA já cadastrado');
      err.statusCode = 409;
      throw err;
    }
  }

  const passwordHash = await hashPassword(password || email);
  const userRole = role || 'USER';

  const user = await prisma.user.create({
    data: {
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
    },
    select: {
      id: true,
      name: true,
      email: true,
      ra: true,
      role: true,
      isAdmin: true,
      isBlocked: true,
      createdAt: true,
    },
  });

  return user;
}

async function getUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      ra: true,
      course: true,
      gender: true,
      age: true,
      phone: true,
      cep: true,
      role: true,
      isAdmin: true,
      isBlocked: true,
      blockReason: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    const err = new Error('Usuário não encontrado');
    err.statusCode = 404;
    throw err;
  }

  return user;
}

async function updateUser(userId, data, currentUserId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const err = new Error('Usuário não encontrado');
    err.statusCode = 404;
    throw err;
  }

  const isAdminUser = user.role === 'ADMIN' || user.isAdmin;

  // Regras de não remover permissões do próprio usuário / último admin
  const wantsToChangeAdminFlag =
    typeof data.isAdmin !== 'undefined' || typeof data.role !== 'undefined';

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

    const otherAdmins = await prisma.user.count({
      where: {
        id: { not: user.id },
        OR: [{ role: 'ADMIN' }, { isAdmin: true }],
      },
    });

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
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingEmail && existingEmail.id !== user.id) {
      const err = new Error('Email já cadastrado');
      err.statusCode = 409;
      throw err;
    }
  }

  if (typeof data.ra !== 'undefined' && data.ra !== user.ra && data.ra !== null) {
    const existingRa = await prisma.user.findUnique({
      where: { ra: data.ra },
    });
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
    updateData.age =
      data.age === null || data.age === ''
        ? null
        : parseInt(data.age, 10);
  }
  if (typeof data.phone !== 'undefined') updateData.phone = data.phone || null;
  if (typeof data.cep !== 'undefined') updateData.cep = data.cep || null;
  if (typeof data.role !== 'undefined') updateData.role = data.role;
  if (typeof data.isAdmin !== 'undefined') updateData.isAdmin = !!data.isAdmin;
  if (typeof data.isBlocked !== 'undefined') {
    updateData.isBlocked = !!data.isBlocked;
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      ra: true,
      course: true,
      gender: true,
      age: true,
      phone: true,
      cep: true,
      role: true,
      isAdmin: true,
      isBlocked: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updated;
}

async function deleteUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

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

  await prisma.user.delete({
    where: { id: userId },
  });

  return { success: true };
}

async function listDrivers(filters = {}) {
  const { page = 1, limit = 20, isBlocked, search } = filters;
  const pageNumber = parseInt(page, 10) || 1;
  const limitNumber = parseInt(limit, 10) || 20;
  const skip = (pageNumber - 1) * limitNumber;

  const andConditions = [{ role: 'DRIVER' }];

  if (isBlocked === 'true' || isBlocked === true) {
    andConditions.push({ isBlocked: true });
  } else if (isBlocked === 'false' || isBlocked === false) {
    andConditions.push({ isBlocked: false });
  }

  if (search && search.trim()) {
    const term = search.trim();
    andConditions.push({
      OR: [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { ra: { contains: term, mode: 'insensitive' } },
        {
          vehiclesAsDriver: {
            some: {
              OR: [
                { brand: { contains: term, mode: 'insensitive' } },
                { model: { contains: term, mode: 'insensitive' } },
                { plate: { contains: term, mode: 'insensitive' } },
              ],
            },
          },
        },
      ],
    });
  }

  const where = { AND: andConditions };

  const [drivers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        vehiclesAsDriver: true,
      },
      skip,
      take: limitNumber,
      orderBy: { name: 'asc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: drivers.map((d) => ({
      id: d.id,
      name: d.name,
      email: d.email,
      ra: d.ra,
      role: d.role,
      isAdmin: !!d.isAdmin,
      isBlocked: !!d.isBlocked,
      blockReason: d.blockReason ?? null,
      vehicles: d.vehiclesAsDriver,
    })),
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
}

async function listVehicles(filters = {}) {
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
    prisma.vehicle.findMany({
      where,
      include: { driver: { select: { id: true, name: true, email: true, ra: true } } },
      skip,
      take: limitNumber,
      orderBy,
    }),
    prisma.vehicle.count({ where }),
  ]);

  return {
    data: vehicles.map((v) => ({
      id: v.id,
      brand: v.brand,
      model: v.model,
      plate: v.plate,
      year: v.year,
      isDisabled: !!v.isDisabled,
      disabledReason: v.disabledReason ?? null,
      driverId: v.driver?.id,
      driverName: v.driver?.name,
      driverEmail: v.driver?.email,
      driverRa: v.driver?.ra ?? null,
    })),
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
}

async function disableVehicle(vehicleId, disable = true, disabledReason) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });

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

  return prisma.vehicle.update({
    where: { id: vehicleId },
    data: updatePayload,
    include: { driver: { select: { id: true, name: true, email: true } } },
  });
}

async function listReviews(filters = {}) {
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
      { comment: { contains: term, mode: 'insensitive' } },
      { reviewer: { name: { contains: term, mode: 'insensitive' } } },
      { reviewer: { email: { contains: term, mode: 'insensitive' } } },
      { reviewed: { name: { contains: term, mode: 'insensitive' } } },
      { reviewed: { email: { contains: term, mode: 'insensitive' } } },
    ];
  }

  let orderBy = [{ createdAt: 'desc' }];
  if (order === 'rating_desc') orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }];
  else if (order === 'driver_asc') orderBy = [{ reviewed: { name: 'asc' } }];
  else if (order === 'driver_desc') orderBy = [{ reviewed: { name: 'desc' } }];

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        reviewer: { select: { id: true, name: true, email: true, ra: true } },
        reviewed: { select: { id: true, name: true, email: true, ra: true } },
        ride: {
          select: {
            id: true,
            origin: true,
            destination: true,
            departureAt: true,
            arrivalAt: true,
            status: true,
            driver: { select: { id: true, name: true, email: true } },
            vehicle: { select: { brand: true, model: true, plate: true } },
            passengers: {
              include: { passenger: { select: { id: true, name: true, email: true } } },
            },
          },
        },
      },
      skip,
      take: limitNumber,
      orderBy,
    }),
    prisma.review.count({ where }),
  ]);

  return {
    data: reviews.map((r) => ({
      id: r.id,
      rideId: r.rideId,
      rating: r.rating,
      comment: r.comment ?? null,
      isDisabled: !!r.isDisabled,
      disabledReason: r.disabledReason ?? null,
      createdAt: r.createdAt,
      reviewerId: r.reviewer?.id,
      reviewerName: r.reviewer?.name,
      reviewerEmail: r.reviewer?.email,
      reviewerRa: r.reviewer?.ra ?? null,
      reviewedId: r.reviewed?.id,
      reviewedName: r.reviewed?.name,
      reviewedEmail: r.reviewed?.email,
      reviewedRa: r.reviewed?.ra ?? null,
      ride: r.ride
        ? {
            id: r.ride.id,
            origin: r.ride.origin,
            destination: r.ride.destination,
            departureAt: r.ride.departureAt,
            arrivalAt: r.ride.arrivalAt,
            status: r.ride.status,
            driverName: r.ride.driver?.name,
            driverEmail: r.ride.driver?.email,
            vehicle: r.ride.vehicle
              ? `${r.ride.vehicle.brand ?? ''} ${r.ride.vehicle.model ?? ''} (${r.ride.vehicle.plate ?? ''})`.trim()
              : null,
            passengers: (r.ride.passengers ?? []).map((p) => ({
              id: p.passenger?.id,
              name: p.passenger?.name,
              email: p.passenger?.email,
            })),
          }
        : null,
    })),
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
}

async function disableReview(reviewId, disable = true, disabledReason) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

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

  return prisma.review.update({
    where: { id: reviewId },
    data: updatePayload,
    include: {
      reviewer: { select: { id: true, name: true, email: true } },
      reviewed: { select: { id: true, name: true, email: true } },
    },
  });
}

module.exports = {
  listUsers,
  listDrivers,
  listVehicles,
  listReviews,
  blockUser,
  disableVehicle,
  disableReview,
  createUser,
  getUser,
  updateUser,
  deleteUser,
};