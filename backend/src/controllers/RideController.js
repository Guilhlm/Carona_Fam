const rideService = require('../services/ride');
const { success, created } = require('../utils/response');

class RideController {
  constructor(service) {
    this.service = service;
  }

  list = async (req, res, next) => {
    try {
      const { page, limit, status, origin, destination, search, order } = req.query;
      const result = await this.service.listRides({
        page,
        limit,
        status,
        origin,
        destination,
        search,
        order,
      });
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };

  getHistory = async (req, res, next) => {
    try {
      const rides = await this.service.getRideHistory(req.user.id, req.user.role);
      return success(res, rides);
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const ride = await this.service.createRide(req.user.id, req.body);
      return created(res, ride);
    } catch (err) {
      next(err);
    }
  };

  requestRide = async (req, res, next) => {
    try {
      const participation = await this.service.requestRide(req.params.id, req.user.id);
      return created(res, participation);
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (req, res, next) => {
    try {
      const { status } = req.body;
      const ride = await this.service.updateRideStatus(
        req.params.id,
        req.user.id,
        status
      );
      return success(res, ride);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new RideController(rideService);
