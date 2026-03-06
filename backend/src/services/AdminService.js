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

async function listDrivers(filters = {}) {
  const { page = 1, limit = 20, search } = filters;
  const pageNumber = parseInt(page, 10) || 1;
  const limitNumber = parseInt(limit, 10) || 20;
  const skip = (pageNumber - 1) * limitNumber;

  const where = { role: 'DRIVER' };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [drivers, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        vehiclesAsDriver: true,
        _count: {
          select: { ridesAsDriver: true },
        },
      },
      skip,
      take: limitNumber,
      orderBy: { name: 'asc' },
    }),
    prisma.user.count({ where }),
  ]);

  const data = drivers.map((d) => ({
    id: d.id,
    name: d.name,
    email: d.email,
    ra: d.ra,
    isBlocked: d.isBlocked,
    vehicles: d.vehiclesAsDriver,
    rideCount: d._count.ridesAsDriver,
  }));

  return {
    data,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
  };
}

async function listRides(filters = {}) {
  const { page = 1, limit = 20, status, search } = filters;
  const pageNumber = parseInt(page, 10) || 1;
  const limitNumber = parseInt(limit, 10) || 20;
  const skip = (pageNumber - 1) * limitNumber;

  const where = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { origin: { contains: search, mode: 'insensitive' } },
      { destination: { contains: search, mode: 'insensitive' } },
      {
        driver: {
          name: { contains: search, mode: 'insensitive' },
        },
      },
    ];
  }

  const [rides, total] = await Promise.all([
    prisma.ride.findMany({
      where,
      include: {
        driver: { select: { id: true, name: true, email: true } },
        vehicle: { select: { brand: true, model: true, plate: true } },
        passengers: {
          include: { passenger: { select: { id: true, name: true, email: true } } },
        },
      },
      skip,
      take: limitNumber,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.ride.count({ where }),
  ]);

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

async function blockUser(userId, block = true, currentUserId) {
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

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isBlocked: block },
    select: {
      id: true,
      name: true,
      email: true,
      isBlocked: true,
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

async function listVehicles(filters = {}) {
  const { page = 1, limit = 20, driverId } = filters;
  const skip = (page - 1) * limit;

  const where = {};
  if (driverId) {
    where.driverId = driverId;
  }

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      include: {
        driver: {
          select: { id: true, name: true, email: true },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.vehicle.count({ where }),
  ]);

  return {
    data: vehicles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function createVehicle(data) {
  const { driverId, brand, model, plate, year, capacityTotal, photoUrl } = data;

  const driver = await prisma.user.findUnique({
    where: { id: driverId },
  });

  if (!driver || driver.role !== 'DRIVER') {
    const err = new Error('Motorista inválido');
    err.statusCode = 400;
    throw err;
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      driverId,
      brand: brand || null,
      model: model || null,
      plate,
      year: year ? parseInt(year, 10) : null,
      capacityTotal: capacityTotal ? parseInt(capacityTotal, 10) : 4,
      photoUrl: photoUrl || null,
    },
  });

  return vehicle;
}

async function getVehicle(id) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      driver: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!vehicle) {
    const err = new Error('Veículo não encontrado');
    err.statusCode = 404;
    throw err;
  }

  return vehicle;
}

async function updateVehicle(id, data) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
  });

  if (!vehicle) {
    const err = new Error('Veículo não encontrado');
    err.statusCode = 404;
    throw err;
  }

  const updateData = {};

  if (typeof data.brand !== 'undefined') updateData.brand = data.brand || null;
  if (typeof data.model !== 'undefined') updateData.model = data.model || null;
  if (typeof data.plate !== 'undefined') updateData.plate = data.plate;
  if (typeof data.year !== 'undefined') {
    updateData.year =
      data.year === null || data.year === ''
        ? null
        : parseInt(data.year, 10);
  }
  if (typeof data.capacityTotal !== 'undefined') {
    updateData.capacityTotal = parseInt(data.capacityTotal, 10);
  }
  if (typeof data.photoUrl !== 'undefined') {
    updateData.photoUrl = data.photoUrl || null;
  }

  const updated = await prisma.vehicle.update({
    where: { id },
    data: updateData,
  });

  return updated;
}

async function deleteVehicle(id) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
  });

  if (!vehicle) {
    const err = new Error('Veículo não encontrado');
    err.statusCode = 404;
    throw err;
  }

  await prisma.vehicle.delete({
    where: { id },
  });

  return { success: true };
}

async function createRide(data) {
  const {
    origin,
    destination,
    driverId,
    vehicleId,
    departureAt,
    arrivalAt,
    availableSeats,
    distanceKm,
    suggestedValue,
  } = data;

  const driver = await prisma.user.findUnique({
    where: { id: driverId },
  });

  if (!driver || driver.role !== 'DRIVER') {
    const err = new Error('Motorista inválido');
    err.statusCode = 400;
    throw err;
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });

  if (!vehicle || vehicle.driverId !== driverId) {
    const err = new Error('Veículo inválido para este motorista');
    err.statusCode = 400;
    throw err;
  }

  const maxSeats = vehicle.capacityTotal;
  const seats = availableSeats ? parseInt(availableSeats, 10) : maxSeats;

  if (seats > maxSeats) {
    const err = new Error('Número de vagas disponível maior que a capacidade do veículo');
    err.statusCode = 400;
    throw err;
  }

  const ride = await prisma.ride.create({
    data: {
      origin,
      destination,
      driverId,
      vehicleId,
      departureAt: new Date(departureAt),
      arrivalAt: new Date(arrivalAt),
      availableSeats: seats,
      distanceKm: distanceKm || null,
      suggestedValue: suggestedValue || null,
    },
  });

  return ride;
}

async function getRide(id) {
  const ride = await prisma.ride.findUnique({
    where: { id },
    include: {
      driver: { select: { id: true, name: true, email: true } },
      vehicle: { select: { brand: true, model: true, plate: true } },
      passengers: {
        include: { passenger: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!ride) {
    const err = new Error('Corrida não encontrada');
    err.statusCode = 404;
    throw err;
  }

  return ride;
}

async function updateRide(id, data) {
  const ride = await prisma.ride.findUnique({
    where: { id },
  });

  if (!ride) {
    const err = new Error('Corrida não encontrada');
    err.statusCode = 404;
    throw err;
  }

  const updateData = {};

  if (typeof data.origin !== 'undefined') updateData.origin = data.origin;
  if (typeof data.destination !== 'undefined') {
    updateData.destination = data.destination;
  }
  if (typeof data.driverId !== 'undefined') updateData.driverId = data.driverId;
  if (typeof data.vehicleId !== 'undefined') updateData.vehicleId = data.vehicleId;
  if (typeof data.departureAt !== 'undefined') {
    updateData.departureAt = new Date(data.departureAt);
  }
  if (typeof data.arrivalAt !== 'undefined') {
    updateData.arrivalAt = new Date(data.arrivalAt);
  }
  if (typeof data.availableSeats !== 'undefined') {
    updateData.availableSeats = parseInt(data.availableSeats, 10);
  }
  if (typeof data.status !== 'undefined') updateData.status = data.status;
  if (typeof data.distanceKm !== 'undefined') {
    updateData.distanceKm = data.distanceKm;
  }
  if (typeof data.suggestedValue !== 'undefined') {
    updateData.suggestedValue = data.suggestedValue;
  }

  const updated = await prisma.ride.update({
    where: { id },
    data: updateData,
  });

  return updated;
}

async function deleteRide(id) {
  const ride = await prisma.ride.findUnique({
    where: { id },
  });

  if (!ride) {
    const err = new Error('Corrida não encontrada');
    err.statusCode = 404;
    throw err;
  }

  await prisma.ride.delete({
    where: { id },
  });

  return { success: true };
}

module.exports = {
  listUsers,
  listDrivers,
  listRides,
  blockUser,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  listVehicles,
  createVehicle,
  getVehicle,
  updateVehicle,
  deleteVehicle,
  createRide,
  getRide,
  updateRide,
  deleteRide,
};