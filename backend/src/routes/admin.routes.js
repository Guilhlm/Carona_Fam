const express = require('express');
const AdminController = require('../controllers/AdminController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { validateParams } = require('../middlewares/validateRequest');

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', AdminController.listUsers);
router.get('/drivers', AdminController.listDrivers);
router.get('/rides', AdminController.listRides);
router.patch('/users/:id/block', validateParams(['id']), AdminController.blockUser);

module.exports = router;
