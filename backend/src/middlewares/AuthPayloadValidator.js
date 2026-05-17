const { error: respondError } = require('../utils/response');
const InputNormalizer = require('../utils/InputNormalizer');

class AuthPayloadValidator {
  static validateEmailField(rawEmail) {
    const normalizedEmail = InputNormalizer.normalizeEmail(rawEmail);
    if (!normalizedEmail || !InputNormalizer.isValidEmail(normalizedEmail)) {
      return 'Informe um e-mail válido.';
    }
    return null;
  }

  static validatePasswordField(rawPassword) {
    if (!InputNormalizer.isStrongPassword(rawPassword)) {
      return `Senha deve ter ao menos ${InputNormalizer.MIN_PASSWORD_LENGTH} caracteres, incluindo letras e números.`;
    }
    return null;
  }

  static register(req, res, next) {
    const emailErrorMessage = AuthPayloadValidator.validateEmailField(req.body?.email);
    if (emailErrorMessage) return respondError(res, emailErrorMessage, 400);

    const passwordErrorMessage = AuthPayloadValidator.validatePasswordField(req.body?.password);
    if (passwordErrorMessage) return respondError(res, passwordErrorMessage, 400);

    return next();
  }

  static login(req, res, next) {
    const emailErrorMessage = AuthPayloadValidator.validateEmailField(req.body?.email);
    if (emailErrorMessage) return respondError(res, emailErrorMessage, 400);
    return next();
  }

  static resetPassword(req, res, next) {
    const emailErrorMessage = AuthPayloadValidator.validateEmailField(req.body?.email);
    if (emailErrorMessage) return respondError(res, emailErrorMessage, 400);

    const normalizedRa = InputNormalizer.normalizeDigits(req.body?.ra, 20);
    if (!normalizedRa) {
      return respondError(res, 'Informe um RA válido contendo apenas números.', 400);
    }

    const passwordErrorMessage = AuthPayloadValidator.validatePasswordField(req.body?.newPassword);
    if (passwordErrorMessage) return respondError(res, passwordErrorMessage, 400);

    req.body.ra = normalizedRa;
    return next();
  }

  static changePassword(req, res, next) {
    const passwordErrorMessage = AuthPayloadValidator.validatePasswordField(req.body?.newPassword);
    if (passwordErrorMessage) return respondError(res, passwordErrorMessage, 400);
    return next();
  }
}

module.exports = AuthPayloadValidator;
