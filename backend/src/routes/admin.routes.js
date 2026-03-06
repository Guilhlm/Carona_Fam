const express = require('express');
const AdminController = require('../controllers/AdminController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateParams } = require('../middlewares/validateRequest');

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', AdminController.listUsers);
router.post('/users', AdminController.createUser);
router.get('/users/:id', validateParams(['id']), AdminController.getUser);
router.patch('/users/:id', validateParams(['id']), AdminController.updateUser);
router.delete('/users/:id', validateParams(['id']), AdminController.deleteUser);
router.get('/drivers', AdminController.listDrivers);
router.get('/rides', AdminController.listRides);
router.patch('/users/:id/block', validateParams(['id']), AdminController.blockUser);

router.get('/vehicles', AdminController.listVehicles);
router.post('/vehicles', AdminController.createVehicle);
router.get('/vehicles/:id', validateParams(['id']), AdminController.getVehicle);
router.patch('/vehicles/:id', validateParams(['id']), AdminController.updateVehicle);
router.delete('/vehicles/:id', validateParams(['id']), AdminController.deleteVehicle);

router.post('/rides', AdminController.createRide);
router.get('/rides/:id', validateParams(['id']), AdminController.getRide);
router.patch('/rides/:id', validateParams(['id']), AdminController.updateRide);
router.delete('/rides/:id', validateParams(['id']), AdminController.deleteRide);

module.exports = router;