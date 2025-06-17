import { Request, Response } from 'express';
import {
  validateAndSanitize,
  xssProtection,
  validateObjectId,
  validateGameCode,
  preventParameterPollution,
} from '../middleware/security';
import { AppError } from '../middleware/errorHandler';

describe('Security Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      headers: {},
      params: {},
      body: {},
      query: {},
      method: 'GET',
    };
    mockRes = {
      setHeader: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('validateAndSanitize', () => {
    it('should pass valid requests', () => {
      mockReq.method = 'POST';
      mockReq.headers = { 'content-type': 'application/json' };
      mockReq.body = { name: 'John Doe', chips: 1000 };

      validateAndSanitize(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject non-JSON content type for POST requests', () => {
      mockReq.method = 'POST';
      mockReq.headers = { 'content-type': 'text/plain' };

      validateAndSanitize(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('Content-Type must be application/json');
    });

    it('should reject SQL injection patterns', () => {
      mockReq.body = { name: "'; DROP TABLE users; --" };

      validateAndSanitize(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('Invalid input detected');
    });

    it('should reject NoSQL injection patterns', () => {
      mockReq.body = { query: { $where: 'this.password == null' } };

      validateAndSanitize(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('Invalid input detected');
    });

    it('should reject XSS patterns', () => {
      mockReq.body = { comment: '<script>alert("XSS")</script>' };

      validateAndSanitize(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('Invalid input detected');
    });

    it('should reject excessively long strings', () => {
      mockReq.body = { data: 'a'.repeat(10001) };

      validateAndSanitize(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('Input too long in field: body.data');
    });

    it('should check nested objects', () => {
      mockReq.body = {
        user: {
          profile: {
            bio: '<script>evil()</script>',
          },
        },
      };

      validateAndSanitize(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should check query parameters', () => {
      mockReq.query = { search: "'; DROP TABLE users; --" };

      validateAndSanitize(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('xssProtection', () => {
    it('should set security headers', () => {
      xssProtection(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('validateObjectId', () => {
    it('should pass valid MongoDB ObjectId', () => {
      mockReq.params = { id: '507f1f77bcf86cd799439011' };
      const middleware = validateObjectId('id');

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject invalid ObjectId format', () => {
      mockReq.params = { id: 'invalid-id' };
      const middleware = validateObjectId('id');

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('Invalid id format');
    });

    it('should check body if param not found', () => {
      mockReq.body = { gameId: '507f1f77bcf86cd799439011' };
      const middleware = validateObjectId('gameId');

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should pass if id not provided', () => {
      const middleware = validateObjectId('id');

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('validateGameCode', () => {
    it('should pass valid game code', () => {
      mockReq.params = { code: 'ABC123' };

      validateGameCode(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should pass valid game code from body', () => {
      mockReq.body = { code: 'XYZ789' };

      validateGameCode(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should pass valid game code from query', () => {
      mockReq.query = { code: 'DEF456' };

      validateGameCode(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject lowercase letters', () => {
      mockReq.params = { code: 'abc123' };

      validateGameCode(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('Invalid game code format');
    });

    it('should reject wrong length', () => {
      mockReq.params = { code: 'ABC12' };

      validateGameCode(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should reject special characters', () => {
      mockReq.params = { code: 'ABC!23' };

      validateGameCode(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });

    it('should pass if code not provided', () => {
      validateGameCode(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('preventParameterPollution', () => {
    it('should pass with normal parameters', () => {
      mockReq.query = { page: '1', limit: '10', sort: 'name' };

      preventParameterPollution(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject too many parameters', () => {
      mockReq.query = {};
      for (let i = 0; i < 25; i++) {
        mockReq.query[`param${i}`] = 'value';
      }

      preventParameterPollution(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('Too many parameters');
    });
  });
});