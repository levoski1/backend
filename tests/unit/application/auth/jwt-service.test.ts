import jwt from 'jsonwebtoken';
import { JwtService } from '@application/auth/jwt-service';

jest.mock('jsonwebtoken');

const mockSign = jwt.sign as jest.Mock;
const mockVerify = jwt.verify as jest.Mock;

describe('JwtService', () => {
  let jwtService: JwtService;

  beforeEach(() => {
    jest.clearAllMocks();
    jwtService = new JwtService();
  });

  describe('generateAccessToken', () => {
    it('should sign a token with userId and role', () => {
      mockSign.mockReturnValue('access-token');

      const token = jwtService.generateAccessToken('user-1', 'user');

      expect(token).toBe('access-token');
      expect(mockSign).toHaveBeenCalledWith(
        { sub: 'user-1', role: 'user' },
        expect.any(String),
        expect.objectContaining({ expiresIn: expect.any(String) }),
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should return token, jti, and expiration', () => {
      mockSign.mockReturnValue('refresh-token');

      const result = jwtService.generateRefreshToken('user-1');

      expect(result.token).toBe('refresh-token');
      expect(result.jti).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('verifyAccessToken', () => {
    it('should return decoded payload', () => {
      const payload = { sub: 'user-1', role: 'user' };
      mockVerify.mockReturnValue(payload);

      const result = jwtService.verifyAccessToken('some-token');

      expect(result).toEqual(payload);
    });

    it('should throw on invalid token', () => {
      mockVerify.mockImplementation(() => { throw new Error('jwt malformed'); });

      expect(() => jwtService.verifyAccessToken('bad-token')).toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should return decoded payload', () => {
      const payload = { sub: 'user-1', jti: 'jti-1' };
      mockVerify.mockReturnValue(payload);

      const result = jwtService.verifyRefreshToken('some-token');

      expect(result).toEqual(payload);
    });

    it('should throw on invalid token', () => {
      mockVerify.mockImplementation(() => { throw new Error('jwt malformed'); });

      expect(() => jwtService.verifyRefreshToken('bad-token')).toThrow();
    });
  });

  describe('hashToken', () => {
    it('should return a SHA-256 hex hash', () => {
      const hash = jwtService.hashToken('test-token');
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should be deterministic', () => {
      const hash1 = jwtService.hashToken('test-token');
      const hash2 = jwtService.hashToken('test-token');
      expect(hash1).toBe(hash2);
    });
  });
});
