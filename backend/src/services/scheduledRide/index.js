const { prisma } = require('../../config/database');
const ScheduledRideRepository = require('../../repositories/ScheduledRideRepository');
const ScheduledRideService = require('../ScheduledRideService');
const rideService = require('../ride');

const scheduledRideRepository = new ScheduledRideRepository(prisma);
const scheduledRideService = new ScheduledRideService({
  scheduledRideRepository,
  rideService,
});

module.exports = scheduledRideService;
