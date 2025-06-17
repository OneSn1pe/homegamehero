export interface LeaderSession {
  gameId: string;
  gameCode: string;
  hostName: string;
  createdAt: Date;
}

export interface GameAccess {
  gameId: string;
  gameCode: string;
  accessLevel: 'leader' | 'player';
  permissions: {
    canUpdateChips: boolean;
    canAddRebuys: boolean;
    canEndGame: boolean;
    canViewGame: boolean;
  };
}

export interface TokenPayload {
  gameId: string;
  gameCode: string;
  hostName: string;
  accessLevel: 'leader';
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Express.Request {
  auth?: {
    gameId: string;
    gameCode: string;
    hostName: string;
    accessLevel: 'leader' | 'player';
  };
}