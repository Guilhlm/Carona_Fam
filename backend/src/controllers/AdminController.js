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
    const user = await AdminService.blockUser(id, blockValue);
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listUsers,
  listDrivers,
  listRides,
  blockUser,
};
