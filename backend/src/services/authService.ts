import jwt from 'jsonwebtoken';
import { LeaderSession, TokenPayload, GameAccess } from '../types/auth';
import { AppError } from '../middleware/errorHandler';

// Get JWT secret from environment or use a default for development
const JWT_SECRET = process.env['JWT_SECRET'] || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env['JWT_EXPIRES_IN'] || '24h';

/**
 * Generate a JWT token for game leaders
 */
export const generateGameSession = (session: LeaderSession): string => {
  const payload: TokenPayload = {
    gameId: session.gameId,
    gameCode: session.gameCode,
    hostName: session.hostName,
    accessLevel: 'leader',
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
};

/**
 * Verify and decode a leader token
 */
export const verifyLeaderToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token has expired', 401);
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError('Invalid token', 401);
    }
    throw new AppError('Token verification failed', 401);
  }
};

/**
 * Validate if a user has access to a game
 * Returns access level and permissions
 */
export const validateGameAccess = async (
  gameId: string,
  gameCode: string,
  token?: string
): Promise<GameAccess> => {
  // If token is provided, verify it
  if (token) {
    try {
      const decoded = verifyLeaderToken(token);
      
      // Ensure token is for the correct game
      if (decoded.gameId !== gameId || decoded.gameCode !== gameCode) {
        throw new AppError('Token is not valid for this game', 403);
      }

      return {
        gameId,
        gameCode,
        accessLevel: 'leader',
        permissions: {
          canUpdateChips: true,
          canAddRebuys: true,
          canEndGame: true,
          canViewGame: true,
        },
      };
    } catch (error) {
      // If it's a game mismatch error, re-throw it
      if (error instanceof AppError && error.message === 'Token is not valid for this game') {
        throw error;
      }
      // For other token errors (invalid, expired), fall back to player access
      // This allows the request to continue with read-only access
    }
  }

  // Default player access (read-only)
  return {
    gameId,
    gameCode,
    accessLevel: 'player',
    permissions: {
      canUpdateChips: false,
      canAddRebuys: false,
      canEndGame: false,
      canViewGame: true,
    },
  };
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string): string | undefined => {
  if (!authHeader) {
    return undefined;
  }

  // Bearer token format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return undefined;
};