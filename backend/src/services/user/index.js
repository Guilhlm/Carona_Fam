const { prisma } = require('../../config/database');
const UserRepository = require('../../repositories/UserRepository');
const UserService = require('../UserService');

const userRepository = new UserRepository(prisma);

const userService = new UserService({
  userRepository,
});

module.exports = userService;
