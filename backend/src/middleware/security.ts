import { Request, Response, NextFunction } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import { AppError } from './errorHandler';

/**
 * Sanitize user input to prevent NoSQL injection
 * This middleware is already provided by express-mongo-sanitize
 * but we export it here for consistency
 */
export const sanitizeInput = mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ key }: { req: Request; key: string }) => {
    console.warn(`Possible injection attempt blocked in field: ${key}`);
  },
});

/**
 * Custom input validation and sanitization
 */
export const validateAndSanitize = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    // Validate content type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.headers['content-type'];
      if (!contentType || !contentType.includes('application/json')) {
        throw new AppError('Content-Type must be application/json', 400);
      }
    }

    // Check for common SQL injection patterns (even though we use MongoDB)
    const suspiciousPatterns = [
      /(\$where|\$regex|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$exists|\$type)/i,
      /(drop|delete|insert|update|select|union|exec|script)/i,
      /(<script|<\/script|javascript:|onerror=|onclick=)/i,
    ];

    const checkValue = (value: any, path: string): void => {
      if (typeof value === 'string') {
        // Check for suspicious patterns
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(value)) {
            console.warn(`Suspicious pattern detected in ${path}: ${value}`);
            throw new AppError('Invalid input detected', 400);
          }
        }

        // Check for excessively long strings
        if (value.length > 10000) {
          throw new AppError(`Input too long in field: ${path}`, 400);
        }
      } else if (typeof value === 'object' && value !== null) {
        // Check object keys for NoSQL injection patterns
        Object.keys(value).forEach(key => {
          // Check if key contains MongoDB operators
          if (key.startsWith('$') || (suspiciousPatterns[0] && suspiciousPatterns[0].test(key))) {
            console.warn(`Suspicious key detected in ${path}: ${key}`);
            throw new AppError('Invalid input detected', 400);
          }
          checkValue(value[key], `${path}.${key}`);
        });
      }
    };

    // Check request body
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        checkValue(req.body[key], `body.${key}`);
      });
    }

    // Check query parameters
    if (req.query) {
      Object.keys(req.query).forEach(key => {
        checkValue(req.query[key], `query.${key}`);
      });
    }

    // Check URL parameters
    if (req.params) {
      Object.keys(req.params).forEach(key => {
        checkValue(req.params[key], `params.${key}`);
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Prevent XSS by setting security headers
 * This complements helmet.js
 */
export const xssProtection = (_req: Request, res: Response, next: NextFunction): void => {
  // Set additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

/**
 * Validate ObjectId format to prevent injection
 */
export const validateObjectId = (paramName: string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const id = req.params[paramName] || req.body[paramName];
      if (id) {
        // MongoDB ObjectId pattern
        const objectIdPattern = /^[0-9a-fA-F]{24}$/;
        if (!objectIdPattern.test(id)) {
          throw new AppError(`Invalid ${paramName} format`, 400);
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate game code format
 */
export const validateGameCode = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const code = req.params['code'] || req.body.code || req.query['code'];
    if (code) {
      // Game code should be 6 uppercase alphanumeric characters
      const codePattern = /^[A-Z0-9]{6}$/;
      if (!codePattern.test(code)) {
        throw new AppError('Invalid game code format', 400);
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Prevent parameter pollution
 */
export const preventParameterPollution = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    // Check for duplicate parameters
    const queryKeys = Object.keys(req.query);
    const uniqueKeys = new Set(queryKeys);
    
    if (queryKeys.length !== uniqueKeys.size) {
      throw new AppError('Duplicate parameters detected', 400);
    }

    // Limit number of parameters
    if (queryKeys.length > 20) {
      throw new AppError('Too many parameters', 400);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Security middleware stack
 * Combines all security middleware into one
 */
export const securityMiddleware = [
  sanitizeInput,
  validateAndSanitize,
  xssProtection,
  preventParameterPollution,
];