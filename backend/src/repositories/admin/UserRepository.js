class UserRepository {
  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  async listUsers(filters = {}) {
    const { page = 1, limit = 20, isBlocked, role, search, excludeUserId } = filters;
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 20;
    const skip = (pageNumber - 1) * limitNumber;

    const andConditions = [];

    if (excludeUserId) {
      andConditions.push({ id: { not: excludeUserId } });
    }

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
      this.prisma.user.findMany({
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
      this.prisma.user.count({ where }),
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

  async listDrivers(filters = {}) {
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
      this.prisma.user.findMany({
        where,
        include: {
          vehiclesAsDriver: true,
        },
        skip,
        take: limitNumber,
        orderBy: { name: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: drivers.map((driver) => ({
        id: driver.id,
        name: driver.name,
        email: driver.email,
        ra: driver.ra,
        role: driver.role,
        isAdmin: !!driver.isAdmin,
        isBlocked: !!driver.isBlocked,
        blockReason: driver.blockReason ?? null,
        vehicles: driver.vehiclesAsDriver,
      })),
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  findById(userId) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  findByEmail(email) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  findByRa(ra) {
    return this.prisma.user.findUnique({
      where: { ra },
    });
  }

  countOtherAdmins(excludedUserId) {
    return this.prisma.user.count({
      where: {
        id: { not: excludedUserId },
        OR: [{ role: 'ADMIN' }, { isAdmin: true }],
      },
    });
  }

  create(data) {
    return this.prisma.user.create({
      data,
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
  }

  getDetailsById(userId) {
    return this.prisma.user.findUnique({
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
  }

  updateById(userId, data) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
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
  }

  updateBlockStatus(userId, data) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        isBlocked: true,
        blockReason: true,
      },
    });
  }

  deleteById(userId) {
    return this.prisma.user.delete({
      where: { id: userId },
    });
  }
}

module.exports = UserRepository;
