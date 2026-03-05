const express = require('express');
const AuthController = require('../controllers/AuthController');
const { validateBody } = require('../middlewares/validateRequest');

const router = express.Router();

router.post('/register', validateBody(['email', 'password']), AuthController.register);
router.post('/login', validateBody(['email', 'password']), AuthController.login);
router.post(
  '/reset-password',
  validateBody(['email', 'ra', 'newPassword']),
  AuthController.resetPassword
);

module.exports = router;
