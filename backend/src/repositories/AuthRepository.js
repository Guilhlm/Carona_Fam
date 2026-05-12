class AuthRepository {
  constructor(prismaClient) {
    this.prisma = prismaClient;
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

  findAuthUserById(id) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true,
        isAdmin: true,
      },
    });
  }

  createUser(data) {
    return this.prisma.user.create(data);
  }

  updatePasswordById(id, passwordHash) {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }
}

module.exports = AuthRepository;
