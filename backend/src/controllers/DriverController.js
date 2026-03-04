const DriverService = require('../services/DriverService');
const { success } = require('../utils/response');

async function list(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await DriverService.listDrivers({ page, limit });
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const driver = await DriverService.getDriverById(req.params.id);
    return success(res, driver);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getById,
};
