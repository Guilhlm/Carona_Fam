const AuthService = require('../services/AuthService');
const { success, created } = require('../utils/response');

async function register(req, res, next) {
  try {
    const result = await AuthService.register(req.body);
    return created(res, result);
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, ra, newPassword } = req.body;
    const result = await AuthService.resetPasswordWithEmailAndRa(
      email,
      ra,
      newPassword
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { newPassword } = req.body;
    const result = await AuthService.changePassword(req.user.id, newPassword);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  resetPassword,
  changePassword,
};
