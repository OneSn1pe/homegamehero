import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { 
  generateGameSession, 
  verifyLeaderToken, 
  validateGameAccess,
  extractTokenFromHeader 
} from '../services/authService';

// Extend Express Request type to include auth property
interface AuthRequest extends Request {
  auth?: {
    gameId: string;
    gameCode: string;
    hostName: string;
    accessLevel: 'leader' | 'player';
  };
}

/**
 * Generate a JWT token for game leaders
 * This is a middleware wrapper around the service function
 */
export const generateLeaderToken = (gameId: string, gameCode: string, hostName: string): string => {
  return generateGameSession({
    gameId,
    gameCode,
    hostName,
    createdAt: new Date(),
  });
};

/**
 * Middleware to authenticate game leaders
 * Requires a valid JWT token in the Authorization header
 */
export const authenticateLeader = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const decoded = verifyLeaderToken(token);

    // Attach auth info to request
    req.auth = {
      gameId: decoded.gameId,
      gameCode: decoded.gameCode,
      hostName: decoded.hostName,
      accessLevel: 'leader',
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to validate access to a specific game
 * Allows both leaders (with token) and players (with just game code)
 */
export const validateGroupAccess = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get game ID and code from params or body
    const gameId = req.params['id'] || req.body.gameId;
    const gameCode = req.params['code'] || req.body.gameCode;

    if (!gameId && !gameCode) {
      throw new AppError('Game ID or code is required', 400);
    }

    // Extract token if provided
    const token = extractTokenFromHeader(req.headers.authorization);

    // Validate access
    const access = await validateGameAccess(gameId, gameCode, token);

    // Check if user has permission for this action
    const path = req.path;
    const method = req.method;

    // Define which endpoints require leader permissions
    const leaderOnlyEndpoints = [
      { method: 'PUT', pathPattern: /\/chips$/ },
      { method: 'POST', pathPattern: /\/rebuy$/ },
      { method: 'POST', pathPattern: /\/end$/ },
    ];

    // Check if current request requires leader permissions
    const requiresLeader = leaderOnlyEndpoints.some(
      endpoint => endpoint.method === method && endpoint.pathPattern.test(path)
    );

    if (requiresLeader && access.accessLevel !== 'leader') {
      throw new AppError('Leader authentication required for this action', 403);
    }

    // Attach auth info to request
    req.auth = {
      gameId: access.gameId,
      gameCode: access.gameCode,
      hostName: token ? verifyLeaderToken(token).hostName : '',
      accessLevel: access.accessLevel,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to ensure the authenticated user is the game leader
 * Must be used after authenticateLeader
 */
export const requireGameLeader = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.auth || req.auth.accessLevel !== 'leader') {
      throw new AppError('Leader access required', 403);
    }

    // Verify the leader is accessing their own game
    const gameId = req.params['id'] || req.body.gameId;
    if (gameId && req.auth.gameId !== gameId) {
      throw new AppError('You can only modify your own game', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};