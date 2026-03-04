const { prisma } = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');

async function register(data) {
  const { email, password, name, ra, course, gender, age, phone, cep, role } = data;

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

  const passwordHash = await hashPassword(password);
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
    },
    select: {
      id: true,
      email: true,
      name: true,
      ra: true,
      role: true,
      isAdmin: true,
      createdAt: true,
    },
  });

  const token = signToken({ sub: user.id, role: user.role });
  return { user, token };
}

async function login(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    const err = new Error('Email ou senha inválidos');
    err.statusCode = 401;
    throw err;
  }

  if (user.isBlocked) {
    const err = new Error('Usuário bloqueado');
    err.statusCode = 403;
    throw err;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    const err = new Error('Email ou senha inválidos');
    err.statusCode = 401;
    throw err;
  }

  const token = signToken({ sub: user.id, role: user.role });
  const userData = {
    id: user.id,
    email: user.email,
    name: user.name,
    ra: user.ra,
    role: user.role,
    isAdmin: user.isAdmin,
  };

  return { user: userData, token };
}

module.exports = {
  register,
  login,
};
