class HttpError extends Error {
  constructor(message, statusCode = 400, details = {}) {
    super(message);
    this.statusCode = statusCode;
    Object.assign(this, details);
  }

  static badRequest(message, details) {
    return new HttpError(message, 400, details);
  }

  static unauthorized(message, details) {
    return new HttpError(message, 401, details);
  }

  static forbidden(message, details) {
    return new HttpError(message, 403, details);
  }

  static notFound(message, details) {
    return new HttpError(message, 404, details);
  }

  static conflict(message, details) {
    return new HttpError(message, 409, details);
  }

  static internal(message, details) {
    return new HttpError(message, 500, details);
  }
}

module.exports = HttpError;
