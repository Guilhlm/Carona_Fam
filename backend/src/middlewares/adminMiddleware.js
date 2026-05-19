const { error } = require('../utils/response');
const { isAdminUser } = require('../utils/roles');

function adminMiddleware(req, res, next) {
  if (!req.user) {
    return error(res, 'Autenticação necessária', 401);
  }

  if (!isAdminUser(req.user)) {
    return error(res, 'Acesso negado. Apenas administradores.', 403);
  }

  next();
}

module.exports = adminMiddleware;
