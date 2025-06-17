// Core calculation service for poker game calculations

import { 
  IPlayer, 
  IChipColor, 
  IGame 
} from '../types/models';

import {
  PlayerEarnings,
  PayoutResult,
  VenmoPayment,
  ChipValidationResult,
  GameCalculationResult
} from '../types/calculations';

import {
  roundMoney,
  addMoney,
  subtractMoney,
  multiplyMoney,
  areMoneyAmountsEqual,
  sumMoney,
  isValidMoneyAmount
} from '../utils/money';

/**
 * Calculates the total chip value and earnings for a player
 */
export function calculatePlayerEarnings(
  player: IPlayer, 
  chipConfig: IChipColor[]
): PlayerEarnings {
  let totalValue = 0;
  
  // Calculate total chip value
  for (const [color, count] of Object.entries(player.currentChips)) {
    const chipColor = chipConfig.find(c => c.name === color);
    if (!chipColor) {
      console.warn(`Chip color "${color}" not found in configuration`);
      continue;
    }
    
    if (!isValidMoneyAmount(chipColor.value)) {
      throw new Error(`Invalid chip value for color "${color}"`);
    }
    
    if (count < 0) {
      throw new Error(`Negative chip count for color "${color}"`);
    }
    
    totalValue = addMoney(totalValue, multiplyMoney(chipColor.value, count));
  }
  
  const netEarnings = subtractMoney(totalValue, player.totalBuyIn);
  const earningsPercentage = player.totalBuyIn > 0 
    ? (netEarnings / player.totalBuyIn) * 100 
    : 0;
  
  return {
    name: player.name,
    chipValue: totalValue,
    netEarnings: netEarnings,
    earningsPercentage: roundMoney(earningsPercentage),
    totalBuyIn: player.totalBuyIn
  };
}

/**
 * Calculates payouts for all players
 */
export function calculatePayouts(
  players: IPlayer[], 
  chipConfig: IChipColor[], 
  totalPot: number
): PayoutResult[] {
  if (!isValidMoneyAmount(totalPot)) {
    throw new Error('Invalid total pot amount');
  }
  
  if (players.length === 0) {
    throw new Error('No players to calculate payouts for');
  }
  
  // Calculate earnings for each player
  const results = players.map(player => {
    const earnings = calculatePlayerEarnings(player, chipConfig);
    return {
      name: player.name,
      chipValue: earnings.chipValue,
      buyIn: player.totalBuyIn,
      finalPayout: earnings.chipValue,
      netGain: earnings.netEarnings
    };
  });
  
  // Validate total chip value matches pot
  const totalChipValue = sumMoney(results.map(p => p.chipValue));
  
  if (!areMoneyAmountsEqual(totalChipValue, totalPot)) {
    console.warn(`Chip value mismatch: Total chips = ${totalChipValue}, Pot = ${totalPot}`);
  }
  
  return results;
}

/**
 * Generates optimized Venmo payment map
 * Minimizes the number of transactions needed
 */
export function generateVenmoMap(payouts: PayoutResult[]): VenmoPayment[] {
  // Create mutable copies of winners and losers with their amounts
  const winners = payouts
    .filter(p => p.netGain > 0)
    .map(p => ({ name: p.name, amount: p.netGain }))
    .sort((a, b) => b.amount - a.amount);
    
  const losers = payouts
    .filter(p => p.netGain < 0)
    .map(p => ({ name: p.name, amount: Math.abs(p.netGain) }))
    .sort((a, b) => b.amount - a.amount);
  
  const payments: VenmoPayment[] = [];
  let winnerIndex = 0;
  let loserIndex = 0;
  
  // Match winners and losers to minimize transactions
  while (winnerIndex < winners.length && loserIndex < losers.length) {
    const winner = winners[winnerIndex];
    const loser = losers[loserIndex];
    
    if (!winner || !loser) break;
    
    // Determine payment amount (minimum of what's owed and what's needed)
    const paymentAmount = Math.min(winner.amount, loser.amount);
    
    // Only create payment if it's more than 1 cent
    if (paymentAmount > 0.01) {
      payments.push({
        from: loser.name,
        to: winner.name,
        amount: roundMoney(paymentAmount),
        note: 'Poker game settlement'
      });
      
      // Update remaining amounts
      winner.amount = subtractMoney(winner.amount, paymentAmount);
      loser.amount = subtractMoney(loser.amount, paymentAmount);
    }
    
    // Move to next person if current one is settled
    if (winner.amount < 0.01) winnerIndex++;
    if (loser.amount < 0.01) loserIndex++;
  }
  
  // Verify all debts are settled (within rounding tolerance)
  const remainingWinnings = sumMoney(winners.map(w => w.amount));
  const remainingDebts = sumMoney(losers.map(l => l.amount));
  
  if (remainingWinnings > 0.01 || remainingDebts > 0.01) {
    console.warn(`Payment imbalance: Winners need ${remainingWinnings}, Losers owe ${remainingDebts}`);
  }
  
  return payments;
}

/**
 * Validates that the total chip value matches the expected pot
 */
export function validateChipTotal(
  players: IPlayer[],
  chipConfig: IChipColor[],
  expectedPot: number
): ChipValidationResult {
  try {
    if (!isValidMoneyAmount(expectedPot)) {
      return {
        isValid: false,
        totalChipValue: 0,
        expectedValue: expectedPot,
        difference: 0,
        errorMessage: 'Invalid expected pot amount'
      };
    }
    
    // Calculate total chip value across all players
    let totalChipValue = 0;
    
    for (const player of players) {
      const earnings = calculatePlayerEarnings(player, chipConfig);
      totalChipValue = addMoney(totalChipValue, earnings.chipValue);
    }
    
    const difference = subtractMoney(totalChipValue, expectedPot);
    const isValid = areMoneyAmountsEqual(totalChipValue, expectedPot);
    
    return {
      isValid,
      totalChipValue,
      expectedValue: expectedPot,
      difference,
      errorMessage: isValid ? undefined : `Chip total (${totalChipValue}) does not match pot (${expectedPot})`
    };
  } catch (error) {
    return {
      isValid: false,
      totalChipValue: 0,
      expectedValue: expectedPot,
      difference: 0,
      errorMessage: error instanceof Error ? error.message : 'Unknown validation error'
    };
  }
}

/**
 * Performs all calculations for a game and returns comprehensive results
 */
export function calculateGameResults(game: IGame): GameCalculationResult {
  const chipConfig = game.chipConfig.colors;
  const players = game.players;
  const totalPot = game.financials.totalPot;
  
  // Validate the game data
  if (!chipConfig || chipConfig.length === 0) {
    throw new Error('No chip configuration found');
  }
  
  if (!players || players.length === 0) {
    throw new Error('No players found');
  }
  
  // Perform calculations
  const playerEarnings = players.map(player => 
    calculatePlayerEarnings(player, chipConfig)
  );
  
  const payouts = calculatePayouts(players, chipConfig, totalPot);
  const venmoPayments = generateVenmoMap(payouts);
  const validationResult = validateChipTotal(players, chipConfig, totalPot);
  
  return {
    playerEarnings,
    payouts,
    venmoPayments,
    validationResult
  };
}