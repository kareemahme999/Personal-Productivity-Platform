export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(statusCode: number, message: string, code = 'ERROR', details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(resource = 'Resource') {
    return new ApiError(404, `${resource} not found`, 'NOT_FOUND');
  }

  static conflict(message: string) {
    return new ApiError(409, message, 'CONFLICT');
  }

  static tooManyRequests(message = 'Too many requests, please try again later') {
    return new ApiError(429, message, 'RATE_LIMITED');
  }
}
