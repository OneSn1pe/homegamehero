import { Request, Response } from 'express';
import {
  gameCreationLimiter,
  apiRateLimiter,
  strictRateLimiter,
  websocketRateLimiter,
} from '../middleware/rateLimiter';

// Mock express-rate-limit
jest.mock('express-rate-limit', () => {
  return jest.fn((options: any) => {
    const middleware = (req: Request, res: Response, next: Function) => {
      // Simulate rate limiting logic
      const key = req.ip || 'default';
      if (!middleware.store) {
        middleware.store = new Map();
      }
      
      const count = middleware.store.get(key) || 0;
      middleware.store.set(key, count + 1);
      
      if (count >= options.max) {
        if (options.handler) {
          options.handler(req, res);
        } else {
          res.status(429).json({
            error: options.message,
          });
        }
      } else {
        next();
      }
    };
    middleware.store = new Map();
    middleware.options = options;
    return middleware;
  });
});

describe('Rate Limiters', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1',
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('gameCreationLimiter', () => {
    it('should have correct configuration', () => {
      expect((gameCreationLimiter as any).options).toMatchObject({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 5,
        message: 'Too many games created from this IP, please try again after an hour',
        standardHeaders: true,
        legacyHeaders: false,
      });
    });

    it('should have custom handler', () => {
      const handler = (gameCreationLimiter as any).options.handler;
      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Too many games created from this IP, please try again after an hour',
        },
      });
    });
  });

  describe('apiRateLimiter', () => {
    it('should have correct configuration', () => {
      expect((apiRateLimiter as any).options).toMatchObject({
        windowMs: 60 * 1000, // 1 minute
        max: 100,
        message: 'Too many requests from this IP, please try again after a minute',
        standardHeaders: true,
        legacyHeaders: false,
      });
    });

    it('should have custom handler', () => {
      const handler = (apiRateLimiter as any).options.handler;
      handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Too many requests from this IP, please try again after a minute',
        },
      });
    });
  });

  describe('strictRateLimiter', () => {
    it('should have correct configuration', () => {
      expect((strictRateLimiter as any).options).toMatchObject({
        windowMs: 60 * 1000, // 1 minute
        max: 20,
        message: 'Too many requests from this IP, please try again after a minute',
        standardHeaders: true,
        legacyHeaders: false,
      });
    });

    it('should skip authenticated requests', () => {
      const skipFn = (strictRateLimiter as any).options.skip;
      
      // Test without auth header
      expect(skipFn({ headers: {} })).toBe(false);
      
      // Test with Bearer token
      expect(skipFn({ headers: { authorization: 'Bearer token' } })).toBe(true);
      
      // Test with other auth type
      expect(skipFn({ headers: { authorization: 'Basic credentials' } })).toBe(false);
    });
  });

  describe('websocketRateLimiter', () => {
    it('should have correct configuration', () => {
      expect((websocketRateLimiter as any).options).toMatchObject({
        windowMs: 60 * 1000, // 1 minute
        max: 10,
        message: 'Too many WebSocket connections from this IP, please try again after a minute',
        standardHeaders: true,
        legacyHeaders: false,
      });
    });
  });

  describe('Rate limiting behavior', () => {
    it('should allow requests under the limit', () => {
      const limiter = apiRateLimiter;
      
      // First request should pass
      limiter(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should block requests over the limit', () => {
      const limiter = gameCreationLimiter;
      const store = (limiter as any).store;
      
      // Set count to max
      store.set('127.0.0.1', 5);
      
      // Next request should be blocked
      limiter(mockReq as Request, mockRes as Response, mockNext);
      
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(429);
    });
  });
});