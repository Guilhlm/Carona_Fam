const driverService = require('../services/driver');
const { success } = require('../utils/response');

class DriverController {
  constructor(service) {
    this.service = service;
  }

  list = async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const result = await this.service.listDrivers({ page, limit });
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req, res, next) => {
    try {
      const driver = await this.service.getDriverById(req.params.id);
      return success(res, driver);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new DriverController(driverService);
