const express = require('express');
const RideController = require('../controllers/RideController');
const authMiddleware = require('../middlewares/authMiddleware');
const { validateBody, validateParams } = require('../middlewares/validateRequest');

const router = express.Router();

router.get('/', RideController.list);
router.get('/history', authMiddleware, RideController.getHistory);
router.post('/', authMiddleware, validateBody(['origin', 'destination', 'vehicleId', 'departureAt', 'arrivalAt']), RideController.create);
router.post('/:id/request', authMiddleware, validateParams(['id']), RideController.requestRide);
router.patch('/:id/status', authMiddleware, validateParams(['id']), validateBody(['status']), RideController.updateStatus);

module.exports = router;
