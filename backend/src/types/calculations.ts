// TypeScript interfaces for calculation-related types

export interface ChipCount {
  [color: string]: number;
}

export interface PlayerEarnings {
  name: string;
  chipValue: number; // Total value of chips in dollars
  netEarnings: number; // chipValue - totalBuyIn
  earningsPercentage: number; // Percentage gain/loss
  totalBuyIn: number;
}

export interface PayoutResult {
  name: string;
  chipValue: number;
  buyIn: number;
  finalPayout: number;
  netGain: number; // finalPayout - buyIn
}

export interface VenmoPayment {
  from: string;
  to: string;
  amount: number; // Amount in dollars, rounded to 2 decimal places
  note: string;
}

export interface ChipValidationResult {
  isValid: boolean;
  totalChipValue: number;
  expectedValue: number;
  difference: number;
  errorMessage?: string;
}

export interface GameCalculationResult {
  playerEarnings: PlayerEarnings[];
  payouts: PayoutResult[];
  venmoPayments: VenmoPayment[];
  validationResult: ChipValidationResult;
}