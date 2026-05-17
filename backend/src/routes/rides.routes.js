const express = require('express');
const RideController = require('../controllers/RideController');
const authMiddleware = require('../middlewares/authMiddleware');
const sseAuthMiddleware = require('../middlewares/sseAuthMiddleware');
const { validateBody, validateParams } = require('../middlewares/validateRequest');

const router = express.Router();

router.get('/', RideController.list);

router.get('/history', authMiddleware, RideController.getHistory);

router.get('/open/stream', sseAuthMiddleware, RideController.streamOpenRides);
router.get('/:id/stream', sseAuthMiddleware, validateParams(['id']), RideController.streamRide);

router.post(
  '/request',
  authMiddleware,
  validateBody(['origin', 'destination', 'originLat', 'originLng', 'destinationLat', 'destinationLng']),
  RideController.requestNewRide
);
router.get('/open', authMiddleware, RideController.listOpenRides);
router.get('/me/active', authMiddleware, RideController.getActive);
router.get('/:id', authMiddleware, validateParams(['id']), RideController.getDetail);
router.post('/:id/accept', authMiddleware, validateParams(['id']), RideController.accept);
router.patch(
  '/:id/status',
  authMiddleware,
  validateParams(['id']),
  validateBody(['status']),
  RideController.updateStatus
);
router.post(
  '/:id/cancel',
  authMiddleware,
  validateParams(['id']),
  validateBody(['reason']),
  RideController.cancel
);

router.post(
  '/',
  authMiddleware,
  validateBody(['origin', 'destination', 'vehicleId']),
  RideController.create
);
router.post('/:id/request', authMiddleware, validateParams(['id']), RideController.requestRide);

module.exports = router;
