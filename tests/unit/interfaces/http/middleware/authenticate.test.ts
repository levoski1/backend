import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, type AuthenticatedRequest } from '@interfaces/http/middleware/authenticate';

jest.mock('jsonwebtoken');

const mockVerify = jwt.verify as jest.Mock;

function mockReq(authHeader?: string): Request {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as Request;
}

function mockRes(): Response {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as unknown as Response;
}

describe('authenticate middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call next with AuthenticationError when no auth header', () => {
    const req = mockReq();
    const res = mockRes();
    const next: NextFunction = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, code: 'AUTHENTICATION_ERROR' }),
    );
  });

  it('should call next with AuthenticationError when header is not Bearer', () => {
    const req = mockReq('Basic token');
    const res = mockRes();
    const next: NextFunction = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 }),
    );
  });

  it('should set req.user for valid token', () => {
    mockVerify.mockReturnValue({ sub: 'user-1', role: 'user' });
    const req = mockReq('Bearer valid-token');
    const res = mockRes();
    const next: NextFunction = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect((req as AuthenticatedRequest).user).toEqual({ id: 'user-1', role: 'user' });
  });

  it('should call next with AuthenticationError when token is invalid', () => {
    mockVerify.mockImplementation(() => { throw new Error('jwt malformed'); });
    const req = mockReq('Bearer bad-token');
    const res = mockRes();
    const next: NextFunction = jest.fn();

    authenticate(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401, code: 'AUTHENTICATION_ERROR' }),
    );
  });
});
