const vehicleService = require('../services/vehicle');
const { success } = require('../utils/response');

class VehicleController {
  constructor(service) {
    this.service = service;
  }

  assertDriverRole(user) {
    if (user?.role !== 'DRIVER') {
      const err = new Error('Apenas motoristas podem gerenciar veículos.');
      err.statusCode = 403;
      throw err;
    }
  }

  getMyVehicle = async (req, res, next) => {
    try {
      const { id } = req.user || {};
      this.assertDriverRole(req.user);
      const vehicle = await this.service.getMyVehicle(id);
      return success(res, vehicle);
    } catch (err) {
      next(err);
    }
  };

  getMyVehicles = async (req, res, next) => {
    try {
      const { id } = req.user || {};
      this.assertDriverRole(req.user);
      const vehicles = await this.service.getMyVehicles(id);
      return success(res, vehicles);
    } catch (err) {
      next(err);
    }
  };

  upsertMyVehicle = async (req, res, next) => {
    try {
      const { id } = req.user || {};
      this.assertDriverRole(req.user);
      const vehicle = await this.service.upsertMyVehicle(id, req.body || {});
      return success(res, vehicle);
    } catch (err) {
      next(err);
    }
  };

  createNewVehicle = async (req, res, next) => {
    try {
      const { id } = req.user || {};
      this.assertDriverRole(req.user);
      const vehicle = await this.service.createNewVehicle(id, req.body || {});
      return success(res, vehicle);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new VehicleController(vehicleService);