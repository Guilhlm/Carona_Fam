const { prisma } = require('../../config/database');
const { hashPassword } = require('../../utils/password');
const UserRepository = require('../../repositories/admin/UserRepository');
const VehicleRepository = require('../../repositories/admin/VehicleRepository');
const ReviewRepository = require('../../repositories/admin/ReviewRepository');
const RideRepository = require('../../repositories/admin/RideRepository');
const AdminApplicationService = require('./AdminApplicationService');

const userRepository = new UserRepository(prisma);
const vehicleRepository = new VehicleRepository(prisma);
const reviewRepository = new ReviewRepository(prisma);
const rideRepository = new RideRepository(prisma);

const adminApplicationService = new AdminApplicationService({
  userRepository,
  vehicleRepository,
  reviewRepository,
  rideRepository,
  hashPassword,
});

module.exports = adminApplicationService;
