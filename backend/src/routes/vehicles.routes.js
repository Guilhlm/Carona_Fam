const express = require('express');
const VehicleController = require('../controllers/VehicleController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/me/list', VehicleController.getMyVehicles);
router.get('/me', VehicleController.getMyVehicle);
router.put('/me', VehicleController.upsertMyVehicle);
router.post('/me', VehicleController.createNewVehicle);

module.exports = router;