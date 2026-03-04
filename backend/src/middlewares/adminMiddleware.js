const { error } = require('../utils/response');

function adminMiddleware(req, res, next) {
  if (!req.user) {
    return error(res, 'Autenticação necessária', 401);
  }

  if (req.user.role !== 'ADMIN' && !req.user.isAdmin) {
    return error(res, 'Acesso negado. Apenas administradores.', 403);
  }

  next();
}

module.exports = adminMiddleware;
