// TypeScript interfaces for all models

export interface IChipColor {
  name: string;
  value: number; // value in dollars
}

export interface IRebuy {
  playerName: string;
  amount: number; // amount in dollars
  chipsByColor: Record<string, number>; // { [colorName]: count }
  timestamp: Date;
}

export interface IPlayer {
  name: string;
  initialChips: Record<string, number>; // { [colorName]: count }
  currentChips: Record<string, number>; // { [colorName]: count }
  totalBuyIn: number; // total buy-in amount in dollars
}

export interface IGame {
  id?: string;
  groupCode: string; // 6-digit alphanumeric code
  createdAt: Date;
  status: 'setup' | 'active' | 'completed';
  leaderId: string;
  
  chipConfig: {
    colors: IChipColor[];
  };
  
  financials: {
    initialBuyIn: number; // initial buy-in amount in dollars
    totalPot: number; // total pot including re-buys in dollars
    rebuys: IRebuy[];
  };
  
  players: IPlayer[];
}