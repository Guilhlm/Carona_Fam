const express = require('express');
const AdminController = require('../controllers/AdminController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateParams } = require('../middlewares/validateRequest');

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', AdminController.listUsers);
router.get('/rides', AdminController.listRides);
router.patch('/rides/:id/cancel', validateParams(['id']), AdminController.cancelRide);
router.get('/drivers', AdminController.listDrivers);
router.get('/vehicles', AdminController.listVehicles);
router.get('/reviews', AdminController.listReviews);
router.post('/users', AdminController.createUser);
router.get('/users/:id', validateParams(['id']), AdminController.getUser);
router.patch('/users/:id', validateParams(['id']), AdminController.updateUser);
router.delete('/users/:id', validateParams(['id']), AdminController.deleteUser);
router.patch('/users/:id/block', validateParams(['id']), AdminController.blockUser);
router.patch('/vehicles/:id/disable', validateParams(['id']), AdminController.disableVehicle);
router.patch('/reviews/:id/disable', validateParams(['id']), AdminController.disableReview);

module.exports = router;