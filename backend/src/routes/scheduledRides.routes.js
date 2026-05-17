const express = require('express');
const ScheduledRideController = require('../controllers/ScheduledRideController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateBody, validateParams } = require('../middlewares/validateRequest');

const router = express.Router();

router.use(authMiddleware);

router.post(
  '/',
  validateBody(['origin', 'destination', 'departureAt', 'originLat', 'originLng', 'destinationLat', 'destinationLng']),
  ScheduledRideController.create
);
router.get('/mine', ScheduledRideController.listMine);
router.get('/joined', ScheduledRideController.listJoined);
router.get('/open', ScheduledRideController.listOpen);
router.get('/all', ScheduledRideController.listAll);
router.get('/:id', validateParams(['id']), ScheduledRideController.getDetail);

router.post(
  '/:id/join',
  validateParams(['id']),
  validateBody(['pickupAddress', 'pickupLat', 'pickupLng']),
  ScheduledRideController.joinAsCarona
);
router.delete(
  '/:id/join',
  validateParams(['id']),
  ScheduledRideController.leaveCarona
);
router.post(
  '/:id/request',
  validateParams(['id']),
  ScheduledRideController.convertToRide
);
router.delete(
  '/:id',
  validateParams(['id']),
  ScheduledRideController.cancel
);

module.exports = router;
