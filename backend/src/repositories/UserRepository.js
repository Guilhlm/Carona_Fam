class UserRepository {
  constructor(prismaClient) {
    this.prisma = prismaClient;
  }

  findById(id) {
    return this.prisma.user.findUnique({
      where: { id },
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

  findMeById(id) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        ra: true,
        course: true,
        gender: true,
        age: true,
        phone: true,
        cep: true,
        photoUrl: true,
        role: true,
        isAdmin: true,
        createdAt: true,
      },
    });
  }

  updateById(id, data) {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        ra: true,
        course: true,
        gender: true,
        age: true,
        phone: true,
        cep: true,
        photoUrl: true,
        role: true,
        isAdmin: true,
        createdAt: true,
      },
    });
  }
}

module.exports = UserRepository;
