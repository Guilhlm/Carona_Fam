const UserService = require('../services/UserService');
const { success } = require('../utils/response');

async function getMe(req, res, next) {
  try {
    const user = await UserService.getMe(req.user.id);
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const user = await UserService.updateMe(req.user.id, req.body);
    return success(res, user);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMe,
  updateMe,
};
