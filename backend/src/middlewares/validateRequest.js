const { error } = require('../utils/response');

function validateBody(requiredFields) {
  return (req, res, next) => {
    const body = req.body || {};
    const missing = requiredFields.filter((field) => {
      const value = body[field];
      if (value === undefined || value === null) return true;
      if (typeof value === 'string' && value.trim() === '') return true;
      return false;
    });

    if (missing.length > 0) {
      return error(res, `Campos obrigatórios faltando: ${missing.join(', ')}`, 400);
    }

    next();
  };
}

function validateParams(requiredParams) {
  return (req, res, next) => {
    const params = req.params || {};
    const missing = requiredParams.filter((param) => {
      const value = params[param];
      if (value === undefined || value === null) return true;
      if (typeof value === 'string' && value.trim() === '') return true;
      return false;
    });

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
