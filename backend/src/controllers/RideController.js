const rideService = require('../services/ride');
const legacyRideService = require('../services/legacyRide');
const realtimeService = require('../services/realtime');
const { success, created, error: respondError } = require('../utils/response');
const { isAdminUser } = require('../utils/roles');

class RideController {
  constructor({ rideService: newRideService, legacyRideService: legacyService }) {
    this.rideService = newRideService;
    this.legacyRideService = legacyService;
  }

  list = async (req, res, next) => {
    try {
      const { page, limit, status, origin, destination, search, order } = req.query;
      const listResult = await this.legacyRideService.listRides({
        page,
        limit,
        status,
        origin,
        destination,
        search,
        order,
      });
      return success(res, listResult);
    } catch (err) {
      next(err);
    }
  };

  getHistory = async (req, res, next) => {
    try {
      const rideHistory = await this.legacyRideService.getRideHistory(req.user.id, req.user.role);
      return success(res, rideHistory);
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const createdRide = await this.legacyRideService.createRide(req.user.id, req.body);
      return created(res, createdRide);
    } catch (err) {
      next(err);
    }
  };

  requestNewRide = async (req, res, next) => {
    try {
      const createdRide = await this.rideService.requestNewRide(req.user.id, req.body);
      return created(res, createdRide);
    } catch (err) {
      next(err);
    }
  };

  listOpenRides = async (req, res, next) => {
    try {
      const isDriver = req.user.role === 'DRIVER';
      if (!isDriver && !isAdminUser(req.user)) {
        return respondError(res, 'Apenas motoristas podem listar corridas abertas', 403);
      }
      const openRides = await this.rideService.listOpenRides();
      return success(res, openRides);
    } catch (err) {
      next(err);
    }
  };

  getActive = async (req, res, next) => {
    try {
      const activeRide = await this.rideService.getActiveRideForUser(req.user.id);
      return success(res, activeRide);
    } catch (err) {
      next(err);
    }
  };

  getDetail = async (req, res, next) => {
    try {
      const rideDetail = await this.rideService.getRideDetail(req.params.id, req.user);
      return success(res, rideDetail);
    } catch (err) {
      next(err);
    }
  };

  accept = async (req, res, next) => {
    try {
      const { vehicleId } = req.body || {};
      const acceptedRide = await this.rideService.acceptRide(req.params.id, req.user, { vehicleId });
      return success(res, acceptedRide);
    } catch (err) {
      next(err);
    }
  };

  updateStatus = async (req, res, next) => {
    try {
      const { status } = req.body;
      const updatedRide = await this.rideService.transitionStatus(req.params.id, req.user, status);
      return success(res, updatedRide);
    } catch (err) {
      next(err);
    }
  };

  cancel = async (req, res, next) => {
    try {
      const { reason } = req.body || {};
      const cancelledRide = await this.rideService.cancelRide(req.params.id, req.user, { reason });
      return success(res, cancelledRide);
    } catch (err) {
      next(err);
    }
  };

  requestRide = async (req, res, next) => {
    try {
      const passengerLink = await this.legacyRideService.requestRide(req.params.id, req.user.id);
      return created(res, passengerLink);
    } catch (err) {
      next(err);
    }
  };

  streamRide = async (req, res, next) => {
    try {
      const rideDetail = await this.rideService.getRideDetail(req.params.id, req.user);
      realtimeService.subscribe(`ride:${rideDetail.id}`, res, req);

      try {
        res.write(`event: snapshot\n`);
        res.write(`data: ${JSON.stringify({ ride: rideDetail })}\n\n`);
      } catch (snapshotError) {
        realtimeService.detachSubscriber(res);
      }
    } catch (err) {
      next(err);
    }
  };

  streamOpenRides = async (req, res, next) => {
    try {
      const isDriver = req.user.role === 'DRIVER';
      if (!isDriver && !isAdminUser(req.user)) {
        return respondError(res, 'Apenas motoristas podem ouvir corridas abertas', 403);
      }
      realtimeService.subscribe('driver:open-rides', res, req);

      try {
        const openRides = await this.rideService.listOpenRides();
        res.write(`event: snapshot\n`);
        res.write(`data: ${JSON.stringify({ rides: openRides })}\n\n`);
      } catch (snapshotError) {
        realtimeService.detachSubscriber(res);
      }
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new RideController({ rideService, legacyRideService });
