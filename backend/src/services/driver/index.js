const { prisma } = require('../../config/database');
const DriverRepository = require('../../repositories/DriverRepository');
const DriverService = require('../DriverService');

const driverRepository = new DriverRepository(prisma);

const driverService = new DriverService({
  driverRepository,
});

module.exports = driverService;
