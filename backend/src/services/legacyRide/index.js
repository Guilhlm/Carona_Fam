const { prisma } = require('../../config/database');
const RideRepository = require('../../repositories/RideRepository');
const LegacyRideService = require('../LegacyRideService');

const rideRepository = new RideRepository(prisma);

const legacyRideService = new LegacyRideService({ rideRepository });

module.exports = legacyRideService;
