const { prisma } = require('../config/database');
const AuthRepository = require('../repositories/AuthRepository');
const { verifyToken } = require('../utils/jwt');
const { error: respondError } = require('../utils/response');

class SseAuthMiddleware {
  constructor({ authRepository, verifyTokenFn, errorResponse }) {
    this.authRepository = authRepository;
    this.verifyTokenFn = verifyTokenFn;
    this.errorResponse = errorResponse;
  }

  extractToken(req) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    return req.query?.token || null;
  }

  handle = async (req, res, next) => {
    const rawToken = this.extractToken(req);
    if (!rawToken) {
      return this.errorResponse(res, 'Token de autenticação não fornecido', 401);
    }

    const decodedToken = this.verifyTokenFn(rawToken);
    if (!decodedToken) {
      return this.errorResponse(res, 'Token inválido ou expirado', 401);
    }

    try {
      const authenticatedUser = await this.authRepository.findAuthUserById(decodedToken.sub);
      if (!authenticatedUser) {
        return this.errorResponse(res, 'Usuário não encontrado', 401);
      }
      if (authenticatedUser.isBlocked) {
        return this.errorResponse(res, 'Usuário bloqueado', 403);
      }
      req.user = authenticatedUser;
      next();
    } catch (err) {
      next(err);
    }
  };
}

const authRepository = new AuthRepository(prisma);
const sseAuthMiddleware = new SseAuthMiddleware({
  authRepository,
  verifyTokenFn: verifyToken,
  errorResponse: respondError,
});

module.exports = sseAuthMiddleware.handle;
