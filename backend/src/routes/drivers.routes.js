const express = require('express');
const DriverController = require('../controllers/DriverController');
const { validateParams } = require('../middlewares/validateRequest');

const router = express.Router();

router.get('/', DriverController.list);
router.get('/:id', validateParams(['id']), DriverController.getById);

module.exports = router;
