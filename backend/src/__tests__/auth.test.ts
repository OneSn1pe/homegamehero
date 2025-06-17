import { Request, Response } from 'express';
import {
  generateLeaderToken,
  authenticateLeader,
  validateGroupAccess,
  requireGameLeader,
} from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

interface AuthRequest extends Request {
  auth?: {
    gameId: string;
    gameCode: string;
    hostName: string;
    accessLevel: 'leader' | 'player';
  };
}

// Mock the auth service
jest.mock('../services/authService');

describe('Auth Middleware', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      headers: {},
      params: {},
      body: {},
      method: 'GET',
    } as Partial<AuthRequest>;
    Object.defineProperty(mockReq, 'path', {
      value: '',
      writable: true,
      configurable: true
    });
    mockRes = {};
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('generateLeaderToken', () => {
    it('should generate a leader token', () => {
      const authService = require('../services/authService');
      const mockToken = 'generated.token';
      authService.generateGameSession = jest.fn().mockReturnValue(mockToken);

      const token = generateLeaderToken('gameId', 'CODE12', 'Host');

      expect(authService.generateGameSession).toHaveBeenCalledWith({
        gameId: 'gameId',
        gameCode: 'CODE12',
        hostName: 'Host',
        createdAt: expect.any(Date),
      });
      expect(token).toBe(mockToken);
    });
  });

  describe('authenticateLeader', () => {
    beforeEach(() => {
      const authService = require('../services/authService');
      authService.extractTokenFromHeader = jest.fn();
      authService.verifyLeaderToken = jest.fn();
    });

    it('should authenticate valid leader token', async () => {
      const authService = require('../services/authService');
      const mockDecoded = {
        gameId: 'gameId',
        gameCode: 'CODE12',
        hostName: 'Host',
        accessLevel: 'leader',
      };
      
      mockReq.headers = { authorization: 'Bearer valid.token' };
      authService.extractTokenFromHeader.mockReturnValue('valid.token');
      authService.verifyLeaderToken.mockReturnValue(mockDecoded);

      await authenticateLeader(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(authService.extractTokenFromHeader).toHaveBeenCalledWith('Bearer valid.token');
      expect(authService.verifyLeaderToken).toHaveBeenCalledWith('valid.token');
      expect(mockReq.auth).toEqual({
        gameId: 'gameId',
        gameCode: 'CODE12',
        hostName: 'Host',
        accessLevel: 'leader',
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next with error for missing token', async () => {
      const authService = require('../services/authService');
      authService.extractTokenFromHeader.mockReturnValue(undefined);
      
      await authenticateLeader(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('No token provided');
      expect(error.statusCode).toBe(401);
    });

    it('should call next with error for invalid token', async () => {
      const authService = require('../services/authService');
      mockReq.headers = { authorization: 'Bearer invalid.token' };
      authService.extractTokenFromHeader.mockReturnValue('invalid.token');
      authService.verifyLeaderToken.mockImplementation(() => {
        throw new AppError('Invalid token', 401);
      });

      await authenticateLeader(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
    });
  });

  describe('validateGroupAccess', () => {
    beforeEach(() => {
      const authService = require('../services/authService');
      authService.validateGameAccess = jest.fn().mockResolvedValue({
        gameId: '',
        gameCode: 'ABC123',
        accessLevel: 'player',
        permissions: {
          canUpdateChips: false,
          canAddRebuys: false,
          canEndGame: false,
          canViewGame: true,
        },
      });
      authService.extractTokenFromHeader = jest.fn().mockReturnValue(undefined);
    });

    it('should allow read-only access with just game code', async () => {
      mockReq.params = { code: 'ABC123' };
      Object.defineProperty(mockReq, 'path', { value: '/', writable: true });
      mockReq.method = 'GET';

      await validateGroupAccess(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.auth).toBeDefined();
      expect(mockReq.auth?.accessLevel).toBe('player');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should require leader auth for chip updates', async () => {
      mockReq.params = { id: 'gameId' };
      Object.defineProperty(mockReq, 'path', { value: '/chips', writable: true });
      mockReq.method = 'PUT';

      await validateGroupAccess(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('Leader authentication required for this action');
      expect(error.statusCode).toBe(403);
    });

    it('should allow leader access with valid token', async () => {
      const authService = require('../services/authService');
      authService.extractTokenFromHeader = jest.fn().mockReturnValue('valid.token');
      authService.validateGameAccess = jest.fn().mockResolvedValue({
        gameId: 'gameId',
        gameCode: 'CODE12',
        accessLevel: 'leader',
        permissions: {
          canUpdateChips: true,
          canAddRebuys: true,
          canEndGame: true,
          canViewGame: true,
        },
      });
      authService.verifyLeaderToken = jest.fn().mockReturnValue({
        gameId: 'gameId',
        gameCode: 'CODE12',
        hostName: 'Host',
        accessLevel: 'leader',
      });

      mockReq.headers = { authorization: 'Bearer valid.token' };
      mockReq.params = { id: 'gameId' };
      Object.defineProperty(mockReq, 'path', { value: '/chips', writable: true });
      mockReq.method = 'PUT';

      await validateGroupAccess(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockReq.auth?.accessLevel).toBe('leader');
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('requireGameLeader', () => {
    it('should allow access for authenticated leader', async () => {
      mockReq.auth = {
        gameId: 'gameId',
        gameCode: 'CODE12',
        hostName: 'Host',
        accessLevel: 'leader',
      };
      mockReq.params = { id: 'gameId' };

      await requireGameLeader(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access for non-leader', async () => {
      mockReq.auth = {
        gameId: 'gameId',
        gameCode: 'CODE12',
        hostName: '',
        accessLevel: 'player',
      };

      await requireGameLeader(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('Leader access required');
      expect(error.statusCode).toBe(403);
    });

    it('should deny access to different game', async () => {
      mockReq.auth = {
        gameId: 'gameId1',
        gameCode: 'CODE12',
        hostName: 'Host',
        accessLevel: 'leader',
      };
      mockReq.params = { id: 'gameId2' };

      await requireGameLeader(mockReq as AuthRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('You can only modify your own game');
      expect(error.statusCode).toBe(403);
    });
  });
});