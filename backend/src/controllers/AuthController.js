const authService = require('../services/auth');
const { success, created } = require('../utils/response');

class AuthController {
  constructor(service) {
    this.service = service;
  }

  register = async (req, res, next) => {
    try {
      const result = await this.service.register(req.body);
      return created(res, result);
    } catch (err) {
      next(err);
    }
  };

  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await this.service.login(email, password);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req, res, next) => {
    try {
      const { email, ra, newPassword } = req.body;
      const result = await this.service.resetPasswordWithEmailAndRa(
        email,
        ra,
        newPassword
      );
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };

  changePassword = async (req, res, next) => {
    try {
      const { newPassword } = req.body;
      const result = await this.service.changePassword(req.user.id, newPassword);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = new AuthController(authService);
