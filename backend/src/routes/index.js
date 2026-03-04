const express = require('express');
const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const driversRoutes = require('./drivers.routes');
const ridesRoutes = require('./rides.routes');
const adminRoutes = require('./admin.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/drivers', driversRoutes);
router.use('/rides', ridesRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
