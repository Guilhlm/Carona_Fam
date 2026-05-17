const { prisma } = require('../../config/database');
const ReviewRepository = require('../../repositories/ReviewRepository');
const RideRepository = require('../../repositories/RideRepository');
const ReviewService = require('../ReviewService');

const reviewRepository = new ReviewRepository(prisma);
const rideRepository = new RideRepository(prisma);

const reviewService = new ReviewService({ reviewRepository, rideRepository });

module.exports = reviewService;
