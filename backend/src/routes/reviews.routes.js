const express = require('express');
const ReviewController = require('../controllers/ReviewController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateBody, validateParams } = require('../middlewares/validateRequest');

const router = express.Router();

router.get(
  '/ride/:rideId/me',
  authMiddleware,
  validateParams(['rideId']),
  ReviewController.getContext
);

router.post(
  '/ride/:rideId',
  authMiddleware,
  validateParams(['rideId']),
  validateBody(['rating']),
  ReviewController.create
);

module.exports = router;
