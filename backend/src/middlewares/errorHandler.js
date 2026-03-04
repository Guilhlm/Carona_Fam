const logger = require('../utils/logger');
const { error } = require('../utils/response');

function errorHandler(err, req, res, next) {
  logger.error('Error handler:', err.message, err.stack);

  if (err.name === 'JsonWebTokenError') {
    return error(res, 'Token inválido', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return error(res, 'Token expirado', 401);
  }

  if (err.code === 'P2002') {
    return error(res, 'Registro duplicado para campo único', 409);
  }

  if (err.code === 'P2025') {
    return error(res, 'Registro não encontrado', 404);
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Erro interno do servidor';

  return error(res, message, statusCode);
}

module.exports = errorHandler;
