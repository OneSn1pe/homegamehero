export interface ChipValue {
  value: number;
  color: string;
  quantity: number;
}

export interface Player {
  _id: string;
  name: string;
  buyIn: number;
  cashOut?: number;
  rebuys: number;
}

export interface Rebuy {
  playerId: string;
  amount: number;
  timestamp: Date;
}

export interface Payout {
  from: string;
  to: string;
  amount: number;
}

export interface Game {
  _id: string;
  code: string;
  name: string;
  buyIn: number;
  chipValues: ChipValue[];
  players: Player[];
  rebuys: Rebuy[];
  status: 'active' | 'ended';
  payouts?: Payout[];
  totalPot?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateGameData {
  name: string;
  buyIn: number;
  chipValues: ChipValue[];
}

export interface JoinGameData {
  playerName: string;
}

export interface UpdateChipsData {
  playerId: string;
  cashOut: number;
}

export interface AddRebuyData {
  playerId: string;
  amount: number;
}