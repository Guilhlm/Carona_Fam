const { prisma } = require('../../config/database');
const RideRepository = require('../../repositories/RideRepository');
const RideService = require('../RideService');

const rideRepository = new RideRepository(prisma);

const rideService = new RideService({
  rideRepository,
});

module.exports = rideService;
