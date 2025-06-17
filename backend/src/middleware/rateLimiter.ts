import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Rate limiter for game creation
 * Limit: 5 games per hour per IP
 */
export const gameCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many games created from this IP, please try again after an hour',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many games created from this IP, please try again after an hour',
      },
    });
  },
});

/**
 * General API rate limiter
 * Limit: 100 requests per minute per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after a minute',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests from this IP, please try again after a minute',
      },
    });
  },
});

/**
 * Strict rate limiter for sensitive operations
 * Limit: 20 requests per minute per IP
 */
export const strictRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per windowMs
  message: 'Too many requests from this IP, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests from this IP, please try again after a minute',
      },
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for authenticated leaders (optional enhancement)
    const authHeader = req.headers.authorization;
    return !!authHeader && authHeader.startsWith('Bearer ');
  },
});

/**
 * WebSocket connection rate limiter
 * Limit: 10 connections per minute per IP
 */
export const websocketRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 WebSocket connections per windowMs
  message: 'Too many WebSocket connections from this IP, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
});