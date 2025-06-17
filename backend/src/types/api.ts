export interface CreateGameRequest {
  hostName: string;
  buyIn: number;
  chipValues: {
    white: number;
    red: number;
    green: number;
    black: number;
    blue: number;
  };
  blindStructure: Array<{
    level: number;
    smallBlind: number;
    bigBlind: number;
    duration: number;
  }>;
}

export interface CreateGameResponse {
  success: boolean;
  data: {
    gameId: string;
    code: string;
    hostName: string;
    buyIn: number;
    chipValues: {
      white: number;
      red: number;
      green: number;
      black: number;
      blue: number;
    };
    blindStructure: Array<{
      level: number;
      smallBlind: number;
      bigBlind: number;
      duration: number;
    }>;
    status: string;
    createdAt: Date;
  };
}

export interface GetGameResponse {
  success: boolean;
  data: {
    gameId: string;
    code: string;
    hostName: string;
    buyIn: number;
    chipValues: {
      white: number;
      red: number;
      green: number;
      black: number;
      blue: number;
    };
    blindStructure: Array<{
      level: number;
      smallBlind: number;
      bigBlind: number;
      duration: number;
    }>;
    players: Array<{
      playerId: string;
      name: string;
      currentChips: number;
      totalBuyIn: number;
      rebuys: number;
      status: string;
    }>;
    currentBlindLevel: number;
    totalPot: number;
    status: string;
    startTime?: Date;
    endTime?: Date;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface UpdateChipsRequest {
  playerId: string;
  chips: number;
}

export interface UpdateChipsResponse {
  success: boolean;
  data: {
    playerId: string;
    name: string;
    currentChips: number;
    totalBuyIn: number;
    rebuys: number;
    status: string;
  };
}

export interface AddRebuyRequest {
  playerId: string;
  amount: number;
}

export interface AddRebuyResponse {
  success: boolean;
  data: {
    playerId: string;
    name: string;
    currentChips: number;
    totalBuyIn: number;
    rebuys: number;
    status: string;
  };
}

export interface EndGameRequest {
  rankings: Array<{
    playerId: string;
    position: number;
    payout: number;
  }>;
}

export interface EndGameResponse {
  success: boolean;
  data: {
    gameId: string;
    status: string;
    endTime: Date;
    finalRankings: Array<{
      playerId: string;
      playerName: string;
      position: number;
      payout: number;
      profit: number;
    }>;
    totalPot: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    stack?: string;
  };
}