import jwt from 'jsonwebtoken';
import {
  generateGameSession,
  verifyLeaderToken,
  validateGameAccess,
  extractTokenFromHeader,
} from '../services/authService';
import { AppError } from '../middleware/errorHandler';

// Mock JWT
jest.mock('jsonwebtoken');

describe('Auth Service', () => {
  const mockGameId = '507f1f77bcf86cd799439011';
  const mockGameCode = 'ABC123';
  const mockHostName = 'John Doe';
  const mockToken = 'mock.jwt.token';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env['JWT_SECRET'] = 'test-secret';
    process.env['JWT_EXPIRES_IN'] = '24h';
  });

  describe('generateGameSession', () => {
    it('should generate a JWT token for game leader', () => {
      const mockSignedToken = 'signed.jwt.token';
      (jwt.sign as jest.Mock).mockReturnValue(mockSignedToken);

      const session = {
        gameId: mockGameId,
        gameCode: mockGameCode,
        hostName: mockHostName,
        createdAt: new Date(),
      };

      const token = generateGameSession(session);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          gameId: mockGameId,
          gameCode: mockGameCode,
          hostName: mockHostName,
          accessLevel: 'leader',
        },
        expect.any(String),
        expect.objectContaining({ expiresIn: expect.any(String) })
      );
      expect(token).toBe(mockSignedToken);
    });
  });

  describe('verifyLeaderToken', () => {
    it('should verify and decode a valid token', () => {
      const mockDecoded = {
        gameId: mockGameId,
        gameCode: mockGameCode,
        hostName: mockHostName,
        accessLevel: 'leader',
      };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const decoded = verifyLeaderToken(mockToken);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, expect.any(String));
      expect(decoded).toEqual(mockDecoded);
    });

    it('should throw AppError for expired token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired', new Date());
      });

      expect(() => verifyLeaderToken(mockToken)).toThrow(AppError);
      expect(() => verifyLeaderToken(mockToken)).toThrow('Token has expired');
    });

    it('should throw AppError for invalid token', () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token');
      });

      expect(() => verifyLeaderToken(mockToken)).toThrow(AppError);
      expect(() => verifyLeaderToken(mockToken)).toThrow('Invalid token');
    });
  });

  describe('validateGameAccess', () => {
    it('should return leader access for valid token', async () => {
      const mockDecoded = {
        gameId: mockGameId,
        gameCode: mockGameCode,
        hostName: mockHostName,
        accessLevel: 'leader',
      };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      const access = await validateGameAccess(mockGameId, mockGameCode, mockToken);

      expect(access).toEqual({
        gameId: mockGameId,
        gameCode: mockGameCode,
        accessLevel: 'leader',
        permissions: {
          canUpdateChips: true,
          canAddRebuys: true,
          canEndGame: true,
          canViewGame: true,
        },
      });
    });

    it('should return player access when no token provided', async () => {
      const access = await validateGameAccess(mockGameId, mockGameCode);

      expect(access).toEqual({
        gameId: mockGameId,
        gameCode: mockGameCode,
        accessLevel: 'player',
        permissions: {
          canUpdateChips: false,
          canAddRebuys: false,
          canEndGame: false,
          canViewGame: true,
        },
      });
    });

    it('should return player access for invalid token', async () => {
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid token');
      });

      const access = await validateGameAccess(mockGameId, mockGameCode, mockToken);

      expect(access.accessLevel).toBe('player');
    });

    it('should throw error for token from different game', async () => {
      const mockDecoded = {
        gameId: 'differentGameId',
        gameCode: 'XYZ789',
        hostName: mockHostName,
        accessLevel: 'leader',
      };
      (jwt.verify as jest.Mock).mockReturnValue(mockDecoded);

      await expect(validateGameAccess(mockGameId, mockGameCode, mockToken))
        .rejects
        .toThrow('Token is not valid for this game');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const authHeader = 'Bearer mock.jwt.token';
      const token = extractTokenFromHeader(authHeader);
      expect(token).toBe('mock.jwt.token');
    });

    it('should return undefined for missing header', () => {
      const token = extractTokenFromHeader(undefined);
      expect(token).toBeUndefined();
    });

    it('should return undefined for invalid header format', () => {
      expect(extractTokenFromHeader('InvalidFormat')).toBeUndefined();
      expect(extractTokenFromHeader('Basic credentials')).toBeUndefined();
      expect(extractTokenFromHeader('Bearer')).toBeUndefined();
    });
  });
});