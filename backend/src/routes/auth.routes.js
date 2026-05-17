const express = require('express');
const AuthController = require('../controllers/AuthController');
const { validateBody } = require('../middlewares/validateRequest');
const authMiddleware = require('../middlewares/authMiddleware');
const AuthPayloadValidator = require('../middlewares/AuthPayloadValidator');

const router = express.Router();

router.post(
  '/register',
  validateBody(['email', 'password']),
  AuthPayloadValidator.register,
  AuthController.register
);
router.post('/login', validateBody(['email', 'password']), AuthPayloadValidator.login, AuthController.login);
router.post(
  '/reset-password',
  validateBody(['email', 'ra', 'newPassword']),
  AuthPayloadValidator.resetPassword,
  AuthController.resetPassword
);

router.post(
  '/change-password',
  authMiddleware,
  validateBody(['newPassword']),
  AuthPayloadValidator.changePassword,
  AuthController.changePassword
);

module.exports = router;
