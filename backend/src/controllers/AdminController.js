const AdminService = require('../services/AdminService');
const { success } = require('../utils/response');

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

async function listDrivers(req, res, next) {
  try {
    const { page, limit, search } = req.query;
    const result = await AdminService.listDrivers({ page, limit, search });
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function listRides(req, res, next) {
  try {
    const { page, limit, status, search } = req.query;
    const result = await AdminService.listRides({
      page,
      limit,
      status,
      search,
    });
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function blockUser(req, res, next) {
  try {
    const { id } = req.params;
    const { block } = req.body;
    const blockValue = block !== false;
    const user = await AdminService.blockUser(id, blockValue, req.user?.id);
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

async function listVehicles(req, res, next) {
  try {
    const { page, limit, driverId } = req.query;
    const result = await AdminService.listVehicles({
      page,
      limit,
      driverId,
    });
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function createVehicle(req, res, next) {
  try {
    const vehicle = await AdminService.createVehicle(req.body);
    return success(res, vehicle);
  } catch (err) {
    next(err);
  }
}

async function getVehicle(req, res, next) {
  try {
    const { id } = req.params;
    const vehicle = await AdminService.getVehicle(id);
    return success(res, vehicle);
  } catch (err) {
    next(err);
  }
}

async function updateVehicle(req, res, next) {
  try {
    const { id } = req.params;
    const vehicle = await AdminService.updateVehicle(id, req.body);
    return success(res, vehicle);
  } catch (err) {
    next(err);
  }
}

async function deleteVehicle(req, res, next) {
  try {
    const { id } = req.params;
    const result = await AdminService.deleteVehicle(id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function createRide(req, res, next) {
  try {
    const ride = await AdminService.createRide(req.body);
    return success(res, ride);
  } catch (err) {
    next(err);
  }
}

async function getRide(req, res, next) {
  try {
    const { id } = req.params;
    const ride = await AdminService.getRide(id);
    return success(res, ride);
  } catch (err) {
    next(err);
  }
}

async function updateRide(req, res, next) {
  try {
    const { id } = req.params;
    const ride = await AdminService.updateRide(id, req.body);
    return success(res, ride);
  } catch (err) {
    next(err);
  }
}

async function deleteRide(req, res, next) {
  try {
    const { id } = req.params;
    const result = await AdminService.deleteRide(id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers,
  listDrivers,
  listRides,
  blockUser,
  createUser,
  getUser,
  updateUser,
  deleteUser,
  listVehicles,
  createVehicle,
  getVehicle,
  updateVehicle,
  deleteVehicle,
  createRide,
  getRide,
  updateRide,
  deleteRide,
};