const { prisma } = require('../../config/database');
const AuthRepository = require('../../repositories/AuthRepository');
const AuthService = require('../AuthService');
const { hashPassword, comparePassword } = require('../../utils/password');
const { signToken } = require('../../utils/jwt');

const authRepository = new AuthRepository(prisma);

const authService = new AuthService({
  authRepository,
  hashPassword,
  comparePassword,
  signToken,
});

module.exports = authService;
