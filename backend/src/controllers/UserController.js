const userService = require('../services/user');
const { success } = require('../utils/response');

class UserController {
  constructor(service) {
    this.service = service;
  }

  getMe = async (req, res, next) => {
    try {
      const user = await this.service.getMe(req.user.id);
      return success(res, user);
    } catch (err) {
      next(err);
    }
  };

  updateMe = async (req, res, next) => {
    try {
      const user = await this.service.updateMe(req.user.id, req.body);
      return success(res, user);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new UserController(userService);
