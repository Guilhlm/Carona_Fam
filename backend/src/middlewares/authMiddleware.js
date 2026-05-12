const { prisma } = require('../config/database');
const AuthRepository = require('../repositories/AuthRepository');
const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/response');

class AuthMiddleware {
  constructor({ authRepository, verifyTokenFn, errorResponse }) {
    this.authRepository = authRepository;
    this.verifyTokenFn = verifyTokenFn;
    this.errorResponse = errorResponse;
  }

  handle = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return this.errorResponse(res, 'Token de autenticação não fornecido', 401);
    }

    const token = authHeader.substring(7);
    const decoded = this.verifyTokenFn(token);

    if (!decoded) {
      return this.errorResponse(res, 'Token inválido ou expirado', 401);
    }

    try {
      const user = await this.authRepository.findAuthUserById(decoded.sub);

      if (!user) {
        return this.errorResponse(res, 'Usuário não encontrado', 401);
      }

      if (user.isBlocked) {
        return this.errorResponse(res, 'Usuário bloqueado', 403);
      }

      req.user = user;
      next();
    } catch (err) {
      next(err);
    }
  };
}

const authRepository = new AuthRepository(prisma);
const authMiddleware = new AuthMiddleware({
  authRepository,
  verifyTokenFn: verifyToken,
  errorResponse: error,
});

module.exports = authMiddleware.handle;
