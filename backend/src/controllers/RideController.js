const RideService = require('../services/RideService');
const { success, created } = require('../utils/response');

async function list(req, res, next) {
  try {
    const { page, limit, status, origin, destination } = req.query;
    const result = await RideService.listRides({
      page,
      limit,
      status,
      origin,
      destination,
    });
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function getHistory(req, res, next) {
  try {
    const rides = await RideService.getRideHistory(req.user.id, req.user.role);
    return success(res, rides);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const ride = await RideService.createRide(req.user.id, req.body);
    return created(res, ride);
  } catch (err) {
    next(err);
  }
}

async function requestRide(req, res, next) {
  try {
    const participation = await RideService.requestRide(
      req.params.id,
      req.user.id
    );
    return created(res, participation);
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status } = req.body;
    const ride = await RideService.updateRideStatus(
      req.params.id,
      req.user.id,
      status
    );
    return success(res, ride);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getHistory,
  create,
  requestRide,
  updateStatus,
};
