const { prisma } = require('../../config/database');
const VehicleRepository = require('../../repositories/VehicleRepository');
const VehicleService = require('../VehicleService');

const vehicleRepository = new VehicleRepository(prisma);

const vehicleService = new VehicleService({
  vehicleRepository,
});

module.exports = vehicleService;
