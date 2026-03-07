const AdminService = require('../services/AdminService');
const RideService = require('../services/RideService');
const { success } = require('../utils/response');

function serializeRide(ride) {
  if (!ride) return ride;
  const { distanceKm, suggestedValue, ...rest } = ride;
  return {
    ...rest,
    distanceKm: distanceKm != null && typeof distanceKm === 'object' && typeof distanceKm.toNumber === 'function'
      ? distanceKm.toNumber()
      : distanceKm != null ? Number(distanceKm) : null,
    suggestedValue: suggestedValue != null && typeof suggestedValue === 'object' && typeof suggestedValue.toNumber === 'function'
      ? suggestedValue.toNumber()
      : suggestedValue != null ? Number(suggestedValue) : null,
  };
}

async function cancelRide(req, res, next) {
  try {
    const { id } = req.params;
    const ride = await RideService.cancelRideByAdmin(id);
    return success(res, ride);
  } catch (err) {
    next(err);
  }
}

async function listRides(req, res, next) {
  try {
    const { page, limit, status, origin, destination, search, order } = req.query;
    const result = await RideService.listRides({
      page,
      limit,
      status: status || undefined,
      origin: origin || undefined,
      destination: destination || undefined,
      search: search || undefined,
      order: order || undefined,
    });
    const data = Array.isArray(result.data) ? result.data.map(serializeRide) : result.data;
    return success(res, { data, pagination: result.pagination });
  } catch (err) {
    next(err);
  }
}

async function listDrivers(req, res, next) {
  try {
    const { page, limit, isBlocked, search } = req.query;
    const isBlockedParam =
      isBlocked === 'true' ? true : isBlocked === 'false' ? false : undefined;
    const result = await AdminService.listDrivers({
      page,
      limit,
      isBlocked: isBlockedParam,
      search: search || undefined,
    });
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function listVehicles(req, res, next) {
  try {
    const { page, limit, isDisabled, search, order } = req.query;
    const isDisabledParam =
      isDisabled === 'true' ? true : isDisabled === 'false' ? false : undefined;
    const result = await AdminService.listVehicles({
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
}

async function disableVehicle(req, res, next) {
  try {
    const { id } = req.params;
    const { disable, disabledReason } = req.body;
    const disableValue = disable !== false;
    const vehicle = await AdminService.disableVehicle(id, disableValue, disabledReason);
    return success(res, vehicle);
  } catch (err) {
    next(err);
  }
}

async function listReviews(req, res, next) {
  try {
    const { page, limit, isDisabled, search, order } = req.query;
    const isDisabledParam =
      isDisabled === 'true' ? true : isDisabled === 'false' ? false : undefined;
    const result = await AdminService.listReviews({
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
}

async function disableReview(req, res, next) {
  try {
    const { id } = req.params;
    const { disable, disabledReason } = req.body;
    const disableValue = disable !== false;
    const review = await AdminService.disableReview(id, disableValue, disabledReason);
    return success(res, review);
  } catch (err) {
    next(err);
  }
}

async function listUsers(req, res, next) {
  try {
    const { page, limit, isBlocked, role, search } = req.query;
    const isBlockedBool =
      isBlocked === 'true' ? true : isBlocked === 'false' ? false : undefined;
    const result = await AdminService.listUsers({
      page,
      limit,
      isBlocked: isBlockedBool,
      role,
      search,
    });

    const noFilters =
      !search && !role && typeof isBlocked === 'undefined' && (!page || page === '1');

    if (noFilters && req.user && Array.isArray(result?.data)) {
      const currentUserId = req.user.id;
      result.data.sort((a, b) => {
        if (a.id === currentUserId) return -1;
        if (b.id === currentUserId) return 1;
        return 0;
      });
    }

    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function blockUser(req, res, next) {
  try {
    const { id } = req.params;
    const { block, blockReason } = req.body;
    const blockValue = block !== false;
    const user = await AdminService.blockUser(id, blockValue, req.user?.id, blockReason);
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

async function createUser(req, res, next) {
  try {
    const user = await AdminService.createUser(req.body);
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

async function getUser(req, res, next) {
  try {
    const { id } = req.params;
    const user = await AdminService.getUser(id);
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const user = await AdminService.updateUser(id, req.body, currentUserId);
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const result = await AdminService.deleteUser(id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers,
  listRides,
  cancelRide,
  listDrivers,
  listVehicles,
  listReviews,
  blockUser,
  disableVehicle,
  disableReview,
  createUser,
  getUser,
  updateUser,
  deleteUser,
};