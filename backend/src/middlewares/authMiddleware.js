const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/response');
const { prisma } = require('../config/database');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Token de autenticação não fornecido', 401);
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return error(res, 'Token inválido ou expirado', 401);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isBlocked: true,
        isAdmin: true,
      },
    });

    if (!user) {
      return error(res, 'Usuário não encontrado', 401);
    }

    if (user.isBlocked) {
      return error(res, 'Usuário bloqueado', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authMiddleware;
