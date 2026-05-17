const { prisma } = require('../../config/database');
const RideRepository = require('../../repositories/RideRepository');
const RideService = require('../RideService');
const coordinateService = require('../coordinate');
const realtimeService = require('../realtime');

const rideRepository = new RideRepository(prisma);

const rideService = new RideService({
  rideRepository,
  coordinateService,
  realtimeService,
});

module.exports = rideService;
