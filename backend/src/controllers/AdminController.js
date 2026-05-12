const adminApplicationService = require('../services/admin');
const { success } = require('../utils/response');

class AdminController {
  constructor(service) {
    this.service = service;
  }

  cancelRide = async (req, res, next) => {
    try {
      const { id } = req.params;
      const ride = await this.service.cancelRide(id);
      return success(res, ride);
    } catch (err) {
      next(err);
    }
  };

  listRides = async (req, res, next) => {
    try {
      const { page, limit, status, origin, destination, search, order } = req.query;
      const result = await this.service.listRides({
        page,
        limit,
        status: status || undefined,
        origin: origin || undefined,
        destination: destination || undefined,
        search: search || undefined,
        order: order || undefined,
      });
      return success(res, { data: result.data, pagination: result.pagination });
    } catch (err) {
      next(err);
    }
  };

  listDrivers = async (req, res, next) => {
    try {
      const { page, limit, isBlocked, search } = req.query;
      const isBlockedParam =
        isBlocked === 'true' ? true : isBlocked === 'false' ? false : undefined;
      const result = await this.service.listDrivers({
        page,
        limit,
        isBlocked: isBlockedParam,
        search: search || undefined,
      });
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };

  listVehicles = async (req, res, next) => {
    try {
      const { page, limit, isDisabled, search, order } = req.query;
      const isDisabledParam =
        isDisabled === 'true' ? true : isDisabled === 'false' ? false : undefined;
      const result = await this.service.listVehicles({
        page,
        limit,
        isDisabled: isDisabledParam,
        search: search || undefined,
        order: order || undefined,
      });
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };

  disableVehicle = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { disable, disabledReason } = req.body;
      const disableValue = disable !== false;
      const vehicle = await this.service.disableVehicle(id, disableValue, disabledReason);
      return success(res, vehicle);
    } catch (err) {
      next(err);
    }
  };

  listReviews = async (req, res, next) => {
    try {
      const { page, limit, isDisabled, search, order } = req.query;
      const isDisabledParam =
        isDisabled === 'true' ? true : isDisabled === 'false' ? false : undefined;
      const result = await this.service.listReviews({
        page,
        limit,
        isDisabled: isDisabledParam,
        search: search || undefined,
        order: order || undefined,
      });
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };

  disableReview = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { disable, disabledReason } = req.body;
      const disableValue = disable !== false;
      const review = await this.service.disableReview(id, disableValue, disabledReason);
      return success(res, review);
    } catch (err) {
      next(err);
    }
  };

  listUsers = async (req, res, next) => {
    try {
      const { page, limit, isBlocked, role, search } = req.query;
      const isBlockedBool =
        isBlocked === 'true' ? true : isBlocked === 'false' ? false : undefined;
      const result = await this.service.listUsers({
        page,
        limit,
        isBlocked: isBlockedBool,
        role,
        search,
        excludeUserId: req.user?.id,
      });

      return success(res, result);
    } catch (err) {
      next(err);
    }
  };

  blockUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { block, blockReason } = req.body;
      const blockValue = block !== false;
      const user = await this.service.blockUser(id, blockValue, req.user?.id, blockReason);
      return success(res, user);
    } catch (err) {
      next(err);
    }
  };

  createUser = async (req, res, next) => {
    try {
      const user = await this.service.createUser(req.body);
      return success(res, user);
    } catch (err) {
      next(err);
    }
  };

  getUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = await this.service.getUser(id);
      return success(res, user);
    } catch (err) {
      next(err);
    }
  };

  updateUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      const currentUserId = req.user?.id;
      const user = await this.service.updateUser(id, req.body, currentUserId);
      return success(res, user);
    } catch (err) {
      next(err);
    }
  };

  deleteUser = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await this.service.deleteUser(id);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new AdminController(adminApplicationService);