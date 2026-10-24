import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { errorHandler } from '../src/middlewares/errorHandler';

describe('errorHandler', () => {
  function invoke(error: unknown) {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    const request = {
      method: 'POST',
      path: '/api/auth/login',
    } as Request;
    const log = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    errorHandler(error, request, response, jest.fn());

    return { response, log };
  }

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns a generic client response and logs safe diagnostics for a Prisma connection error', () => {
    const error = new Prisma.PrismaClientInitializationError(
      'Authentication failed for postgresql://app:super-secret@localhost/aura',
      '6.19.3',
      'P1000',
    );

    const { response, log } = invoke(error);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      error: { code: 'DATABASE_ERROR', message: 'A database error occurred' },
    });
    expect(log).toHaveBeenCalledTimes(1);
    const logMessage = log.mock.calls[0][1] as string;
    expect(logMessage).toContain('"method":"POST"');
    expect(logMessage).toContain('"path":"/api/auth/login"');
    expect(logMessage).toContain('"prismaCode":"P1000"');
    expect(logMessage).not.toContain('super-secret');
  });

  it('keeps known constraint errors mapped to a safe conflict response', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.19.3',
    });

    const { response, log } = invoke(error);

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'A record with the same unique value already exists',
      },
    });
    expect(log).not.toHaveBeenCalled();
  });
});
