const scheduledRideService = require('../services/scheduledRide');
const { success, created } = require('../utils/response');

class ScheduledRideController {
  constructor(service) {
    this.service = service;
  }

  create = async (req, res, next) => {
    try {
      const ride = await this.service.create(req.user.id, req.body);
      return created(res, ride);
    } catch (err) {
      next(err);
    }
  };

  listMine = async (req, res, next) => {
    try {
      const rides = await this.service.listMine(req.user.id);
      return success(res, rides);
    } catch (err) {
      next(err);
    }
  };

  listJoined = async (req, res, next) => {
    try {
      const rides = await this.service.listJoined(req.user.id);
      return success(res, rides);
    } catch (err) {
      next(err);
    }
  };

  listOpen = async (req, res, next) => {
    try {
      const rides = await this.service.listOpen(req.user.id);
      return success(res, rides);
    } catch (err) {
      next(err);
    }
  };

  listAll = async (req, res, next) => {
    try {
      const rides = await this.service.listAll();
      return success(res, rides);
    } catch (err) {
      next(err);
    }
  };

  getDetail = async (req, res, next) => {
    try {
      const ride = await this.service.getDetail(req.params.id);
      return success(res, ride);
    } catch (err) {
      next(err);
    }
  };

  joinAsCarona = async (req, res, next) => {
    try {
      const ride = await this.service.joinAsCarona(req.params.id, req.user.id, req.body);
      return success(res, ride);
    } catch (err) {
      next(err);
    }
  };

  leaveCarona = async (req, res, next) => {
    try {
      const ride = await this.service.leaveCarona(req.params.id, req.user.id);
      return success(res, ride);
    } catch (err) {
      next(err);
    }
  };

  convertToRide = async (req, res, next) => {
    try {
      const ride = await this.service.convertToRide(req.params.id, req.user.id);
      return created(res, ride);
    } catch (err) {
      next(err);
    }
  };

  cancel = async (req, res, next) => {
    try {
      const result = await this.service.cancel(req.params.id, req.user.id);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new ScheduledRideController(scheduledRideService);
