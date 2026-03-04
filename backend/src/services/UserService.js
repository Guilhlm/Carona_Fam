const { prisma } = require('../config/database');

async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  if (!user) {
    const err = new Error('Usuário não encontrado');
    err.statusCode = 404;
    throw err;
  }

  return user;
}

module.exports = {
  getMe,
};
