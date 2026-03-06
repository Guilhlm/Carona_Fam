const VehicleService = require('../services/VehicleService');
const { success } = require('../utils/response');

async function getMyVehicle(req, res, next) {
  try {
    const { id, role } = req.user || {};

    if (role !== 'DRIVER') {
      const err = new Error('Apenas motoristas podem gerenciar veículos.');
      err.statusCode = 403;
      throw err;
    }

    const vehicle = await VehicleService.getMyVehicle(id);
    return success(res, vehicle);
  } catch (err) {
    next(err);
  }
}

async function upsertMyVehicle(req, res, next) {
  try {
    const { id, role } = req.user || {};

    if (role !== 'DRIVER') {
      const err = new Error('Apenas motoristas podem gerenciar veículos.');
      err.statusCode = 403;
      throw err;
    }

    const vehicle = await VehicleService.upsertMyVehicle(id, req.body || {});
    return success(res, vehicle);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyVehicle,
  upsertMyVehicle,
};