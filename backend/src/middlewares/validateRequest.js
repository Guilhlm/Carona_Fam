const { error } = require('../utils/response');

function validateBody(requiredFields) {
  return (req, res, next) => {
    const body = req.body || {};
    const missing = requiredFields.filter((field) => !body[field]);

    if (missing.length > 0) {
      return error(res, `Campos obrigatórios faltando: ${missing.join(', ')}`, 400);
    }

    next();
  };
}

function validateParams(requiredParams) {
  return (req, res, next) => {
    const params = req.params || {};
    const missing = requiredParams.filter((param) => !params[param]);

    if (missing.length > 0) {
      return error(res, `Parâmetros obrigatórios faltando: ${missing.join(', ')}`, 400);
    }

    next();
  };
}

module.exports = {
  validateBody,
  validateParams,
};
