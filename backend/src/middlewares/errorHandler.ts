import { Prisma } from '@prisma/client';
import { ErrorRequestHandler, Request } from 'express';
import { ApiError } from '../utils/ApiError';

function isPrismaKnownRequestError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

function isPrismaInitializationError(error: unknown): error is Prisma.PrismaClientInitializationError {
  return error instanceof Prisma.PrismaClientInitializationError;
}

function safeDiagnosticMessage(error: unknown): string {
  if (isPrismaKnownRequestError(error)) return `${error.name} (${error.code})`;
  if (!(error instanceof Error)) return 'Unknown error';

  return error.message
    .replace(/((?:postgres(?:ql)?):\/\/[^:/\s@]+:)[^@\s]+@/gi, '$1[redacted]@')
    .replace(/([?&](?:password|token|secret)=)[^&\s]+/gi, '$1[redacted]')
    .replace(/((?:password|token|secret)\s*[:=]\s*)\S+/gi, '$1[redacted]');
}

function logServerError(error: unknown, req: Request, prismaCode?: string): void {
  const details = {
    method: req.method,
    path: req.path,
    errorName: error instanceof Error ? error.name : 'UnknownError',
    ...(prismaCode ? { prismaCode } : {}),
    ...(isPrismaKnownRequestError(error) || isPrismaInitializationError(error)
      ? { prismaClientVersion: error.clientVersion }
      : {}),
    diagnostic: safeDiagnosticMessage(error),
  };

  // eslint-disable-next-line no-console
  console.error('[request-error]', JSON.stringify(details));
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode ?? 500;
  let code = err.code ?? 'INTERNAL_ERROR';
  let message = err.message ?? 'Something went wrong';
  let details: unknown = err.details;
  let prismaCode: string | undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (isPrismaKnownRequestError(err)) {
    switch (err.code) {
      case 'P2002':
        statusCode = 409;
        code = 'DUPLICATE_ENTRY';
        message = 'A record with the same unique value already exists';
        break;
      case 'P2025':
        statusCode = 404;
        code = 'NOT_FOUND';
        message = 'Record not found';
        break;
      case 'P2003':
        statusCode = 400;
        code = 'FK_CONSTRAINT';
        message = 'Operation violates a data relationship';
        break;
      default:
        statusCode = 500;
        code = 'DATABASE_ERROR';
        message = 'A database error occurred';
        break;
    }
    if (statusCode >= 500) prismaCode = err.code;
  } else if (isPrismaInitializationError(err)) {
    statusCode = 500;
    code = 'DATABASE_ERROR';
    message = 'A database error occurred';
    prismaCode = err.errorCode;
  } else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Malformed JSON body';
  } else if (err?.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    code = 'FILE_TOO_LARGE';
    message = 'File is larger than the allowed limit';
  } else if (err?.name === 'MulterError') {
    statusCode = 400;
    code = 'UPLOAD_ERROR';
    message = err.message;
  } else if (err?.type === 'entity.too.large') {
    statusCode = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request body too large';
  } else if (err?.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Invalid token';
  } else if (err?.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Token expired';
  } else if (err?.name === 'ZodError') {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.issues;
  }

  if (statusCode >= 500) {
    logServerError(err, req, prismaCode);
    code = code === 'DATABASE_ERROR' ? code : 'INTERNAL_ERROR';
    message = code === 'DATABASE_ERROR' ? 'A database error occurred' : 'Something went wrong';
    details = undefined;
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  });
};
