// Comprehensive unit tests for calculation service

import {
  calculatePlayerEarnings,
  calculatePayouts,
  generateVenmoMap,
  validateChipTotal,
  calculateGameResults
} from '../services/calculationService';

import { IPlayer, IChipColor, IGame } from '../types/models';
import { PayoutResult } from '../types/calculations';

describe('CalculationService', () => {
  // Sample chip configurations
  const standardChipConfig: IChipColor[] = [
    { name: 'White', value: 1 },
    { name: 'Red', value: 5 },
    { name: 'Green', value: 25 },
    { name: 'Black', value: 100 }
  ];

  const highValueChipConfig: IChipColor[] = [
    { name: 'Red', value: 5 },
    { name: 'Green', value: 25 },
    { name: 'Black', value: 100 },
    { name: 'Purple', value: 500 }
  ];

  describe('calculatePlayerEarnings', () => {
    it('should correctly calculate earnings for a player with mixed chips', () => {
      const player: IPlayer = {
        name: 'John',
        initialChips: { White: 20, Red: 10, Green: 4, Black: 1 },
        currentChips: { White: 30, Red: 15, Green: 6, Black: 2 },
        totalBuyIn: 100
      };

      const earnings = calculatePlayerEarnings(player, standardChipConfig);

      expect(earnings.name).toBe('John');
      expect(earnings.chipValue).toBe(455); // 30*1 + 15*5 + 6*25 + 2*100 = 30 + 75 + 150 + 200
      expect(earnings.netEarnings).toBe(355); // 455 - 100
      expect(earnings.earningsPercentage).toBe(355); // 355/100 * 100
      expect(earnings.totalBuyIn).toBe(100);
    });

    it('should handle zero chips correctly', () => {
      const player: IPlayer = {
        name: 'Jane',
        initialChips: { White: 10, Red: 5 },
        currentChips: { White: 0, Red: 0, Green: 0, Black: 0 },
        totalBuyIn: 50
      };

      const earnings = calculatePlayerEarnings(player, standardChipConfig);

      expect(earnings.chipValue).toBe(0);
      expect(earnings.netEarnings).toBe(-50);
      expect(earnings.earningsPercentage).toBe(-100);
    });

    it('should handle player with no buy-in', () => {
      const player: IPlayer = {
        name: 'Test',
        initialChips: {},
        currentChips: { Red: 10 },
        totalBuyIn: 0
      };

      const earnings = calculatePlayerEarnings(player, standardChipConfig);

      expect(earnings.chipValue).toBe(50);
      expect(earnings.netEarnings).toBe(50);
      expect(earnings.earningsPercentage).toBe(0); // Division by zero case
    });

    it('should warn about unknown chip colors', () => {
      const player: IPlayer = {
        name: 'Player',
        initialChips: {},
        currentChips: { Blue: 5, Red: 10 },
        totalBuyIn: 50
      };

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const earnings = calculatePlayerEarnings(player, standardChipConfig);

      expect(consoleSpy).toHaveBeenCalledWith('Chip color "Blue" not found in configuration');
      expect(earnings.chipValue).toBe(50); // Only Red chips counted
      
      consoleSpy.mockRestore();
    });

    it('should throw error for negative chip counts', () => {
      const player: IPlayer = {
        name: 'Invalid',
        initialChips: {},
        currentChips: { Red: -5 },
        totalBuyIn: 50
      };

      expect(() => calculatePlayerEarnings(player, standardChipConfig))
        .toThrow('Negative chip count for color "Red"');
    });

    it('should handle large chip values without precision errors', () => {
      const player: IPlayer = {
        name: 'HighRoller',
        initialChips: {},
        currentChips: { Purple: 999, Black: 777, Green: 333 },
        totalBuyIn: 50000
      };

      const earnings = calculatePlayerEarnings(player, highValueChipConfig);

      expect(earnings.chipValue).toBe(585525); // 999*500 + 777*100 + 333*25 = 499500 + 77700 + 8325
      expect(earnings.netEarnings).toBe(535525);
    });
  });

  describe('calculatePayouts', () => {
    it('should calculate payouts for multiple players', () => {
      const players: IPlayer[] = [
        {
          name: 'Alice',
          initialChips: {},
          currentChips: { Red: 20, Green: 4 },
          totalBuyIn: 100
        },
        {
          name: 'Bob',
          initialChips: {},
          currentChips: { White: 50, Red: 10 },
          totalBuyIn: 100
        },
        {
          name: 'Charlie',
          initialChips: {},
          currentChips: { Green: 8, Black: 1 },
          totalBuyIn: 100
        }
      ];

      const payouts = calculatePayouts(players, standardChipConfig, 300);

      expect(payouts).toHaveLength(3);
      expect(payouts[0]?.name).toBe('Alice');
      expect(payouts[0]?.chipValue).toBe(200); // 20*5 + 4*25
      expect(payouts[0]?.netGain).toBe(100);

      expect(payouts[1]?.name).toBe('Bob');
      expect(payouts[1]?.chipValue).toBe(100); // 50*1 + 10*5
      expect(payouts[1]?.netGain).toBe(0);

      expect(payouts[2]?.name).toBe('Charlie');
      expect(payouts[2]?.chipValue).toBe(300); // 8*25 + 1*100
      expect(payouts[2]?.netGain).toBe(200);

      // Verify total matches pot
      const totalChips = payouts.reduce((sum, p) => sum + p.chipValue, 0);
      expect(totalChips).toBe(600); // Note: This shows mismatch warning
    });

    it('should handle empty player list', () => {
      expect(() => calculatePayouts([], standardChipConfig, 100))
        .toThrow('No players to calculate payouts for');
    });

    it('should handle invalid pot amount', () => {
      const players: IPlayer[] = [{
        name: 'Test',
        initialChips: {},
        currentChips: {},
        totalBuyIn: 50
      }];

      expect(() => calculatePayouts(players, standardChipConfig, NaN))
        .toThrow('Invalid total pot amount');
    });

    it('should warn about chip value mismatch', () => {
      const players: IPlayer[] = [{
        name: 'Player1',
        initialChips: {},
        currentChips: { Red: 10 },
        totalBuyIn: 50
      }];

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      calculatePayouts(players, standardChipConfig, 100); // Pot doesn't match chips

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Chip value mismatch')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('generateVenmoMap', () => {
    it('should generate optimal payment map for simple case', () => {
      const payouts: PayoutResult[] = [
        { name: 'Winner', chipValue: 150, buyIn: 50, finalPayout: 150, netGain: 100 },
        { name: 'Loser', chipValue: 0, buyIn: 100, finalPayout: 0, netGain: -100 }
      ];

      const payments = generateVenmoMap(payouts);

      expect(payments).toHaveLength(1);
      expect(payments[0]).toEqual({
        from: 'Loser',
        to: 'Winner',
        amount: 100,
        note: 'Poker game settlement'
      });
    });

    it('should handle multiple winners and losers optimally', () => {
      const payouts: PayoutResult[] = [
        { name: 'BigWinner', chipValue: 300, buyIn: 100, finalPayout: 300, netGain: 200 },
        { name: 'SmallWinner', chipValue: 150, buyIn: 100, finalPayout: 150, netGain: 50 },
        { name: 'BigLoser', chipValue: 50, buyIn: 200, finalPayout: 50, netGain: -150 },
        { name: 'SmallLoser', chipValue: 50, buyIn: 100, finalPayout: 50, netGain: -50 },
        { name: 'BreakEven', chipValue: 100, buyIn: 100, finalPayout: 100, netGain: 0 }
      ];

      const payments = generateVenmoMap(payouts);

      // Should minimize transactions
      expect(payments.length).toBeLessThanOrEqual(3);
      
      // Verify all payments sum correctly
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      expect(totalPaid).toBe(200); // Total losses should equal total gains

      // BigLoser should pay BigWinner first
      const bigLoserPayments = payments.filter(p => p.from === 'BigLoser');
      expect(bigLoserPayments[0]?.to).toBe('BigWinner');
    });

    it('should skip tiny payments less than 1 cent', () => {
      const payouts: PayoutResult[] = [
        { name: 'Winner', chipValue: 100.005, buyIn: 100, finalPayout: 100.005, netGain: 0.005 },
        { name: 'Loser', chipValue: 99.995, buyIn: 100, finalPayout: 99.995, netGain: -0.005 }
      ];

      const payments = generateVenmoMap(payouts);

      expect(payments).toHaveLength(0); // Should skip payment < $0.01
    });

    it('should handle no winners or losers', () => {
      const payouts: PayoutResult[] = [
        { name: 'Player1', chipValue: 100, buyIn: 100, finalPayout: 100, netGain: 0 },
        { name: 'Player2', chipValue: 100, buyIn: 100, finalPayout: 100, netGain: 0 }
      ];

      const payments = generateVenmoMap(payouts);

      expect(payments).toHaveLength(0);
    });

    it('should round payment amounts to 2 decimal places', () => {
      const payouts: PayoutResult[] = [
        { name: 'Winner', chipValue: 133.337, buyIn: 100, finalPayout: 133.337, netGain: 33.337 },
        { name: 'Loser', chipValue: 66.663, buyIn: 100, finalPayout: 66.663, netGain: -33.337 }
      ];

      const payments = generateVenmoMap(payouts);

      expect(payments[0]?.amount).toBe(33.34); // Rounded to 2 decimals
    });

    it('should handle complex multi-party settlements', () => {
      const payouts: PayoutResult[] = [
        { name: 'A', chipValue: 250, buyIn: 100, finalPayout: 250, netGain: 150 },
        { name: 'B', chipValue: 180, buyIn: 100, finalPayout: 180, netGain: 80 },
        { name: 'C', chipValue: 120, buyIn: 100, finalPayout: 120, netGain: 20 },
        { name: 'D', chipValue: 30, buyIn: 100, finalPayout: 30, netGain: -70 },
        { name: 'E', chipValue: 20, buyIn: 100, finalPayout: 20, netGain: -80 },
        { name: 'F', chipValue: 0, buyIn: 100, finalPayout: 0, netGain: -100 }
      ];

      const payments = generateVenmoMap(payouts);

      // Verify all debts are settled
      const totalGains = 150 + 80 + 20;
      const totalLosses = 70 + 80 + 100;
      expect(totalGains).toBe(totalLosses);

      const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
      expect(Math.abs(totalPayments - totalGains)).toBeLessThan(0.01);
    });
  });

  describe('validateChipTotal', () => {
    it('should validate matching chip totals', () => {
      const players: IPlayer[] = [
        {
          name: 'Player1',
          initialChips: {},
          currentChips: { Red: 10, Green: 4 },
          totalBuyIn: 100
        },
        {
          name: 'Player2',
          initialChips: {},
          currentChips: { White: 50, Red: 10 },
          totalBuyIn: 100
        }
      ];

      // Player1: 10*5 + 4*25 = 50 + 100 = 150
      // Player2: 50*1 + 10*5 = 50 + 50 = 100
      // Total: 250
      const result = validateChipTotal(players, standardChipConfig, 250);

      expect(result.isValid).toBe(true);
      expect(result.totalChipValue).toBe(250);
      expect(result.difference).toBe(0);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should detect mismatched totals', () => {
      const players: IPlayer[] = [
        {
          name: 'Player1',
          initialChips: {},
          currentChips: { Black: 2 },
          totalBuyIn: 100
        }
      ];

      const result = validateChipTotal(players, standardChipConfig, 100);

      expect(result.isValid).toBe(false);
      expect(result.totalChipValue).toBe(200);
      expect(result.expectedValue).toBe(100);
      expect(result.difference).toBe(100);
      expect(result.errorMessage).toContain('does not match pot');
    });

    it('should handle invalid pot amount', () => {
      const players: IPlayer[] = [];

      const result = validateChipTotal(players, standardChipConfig, -100);

      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Invalid expected pot amount');
    });

    it('should accept small rounding differences', () => {
      const players: IPlayer[] = [
        {
          name: 'Player1',
          initialChips: {},
          currentChips: { White: 100, Red: 1 },
          totalBuyIn: 50.25
        }
      ];

      const result = validateChipTotal(players, standardChipConfig, 105.005);

      expect(result.isValid).toBe(true); // Within 0.01 tolerance
    });
  });

  describe('calculateGameResults', () => {
    it('should calculate complete game results', () => {
      const game: IGame = {
        groupCode: 'ABC123',
        createdAt: new Date(),
        status: 'completed',
        leaderId: 'leader1',
        chipConfig: {
          colors: standardChipConfig
        },
        financials: {
          initialBuyIn: 100,
          totalPot: 300,
          rebuys: []
        },
        players: [
          {
            name: 'Alice',
            initialChips: {},
            currentChips: { Red: 20, Green: 4 }, // 20*5 + 4*25 = 200
            totalBuyIn: 100
          },
          {
            name: 'Bob',
            initialChips: {},
            currentChips: { White: 50 }, // 50*1 = 50
            totalBuyIn: 100
          },
          {
            name: 'Charlie',
            initialChips: {},
            currentChips: { Green: 2 }, // 2*25 = 50
            totalBuyIn: 100
          }
        ]
      };

      const results = calculateGameResults(game);

      expect(results.playerEarnings).toHaveLength(3);
      expect(results.payouts).toHaveLength(3);
      expect(results.venmoPayments.length).toBeGreaterThan(0);
      expect(results.validationResult.isValid).toBe(true);
    });

    it('should handle game with no chip configuration', () => {
      const game: IGame = {
        groupCode: 'ABC123',
        createdAt: new Date(),
        status: 'completed',
        leaderId: 'leader1',
        chipConfig: {
          colors: []
        },
        financials: {
          initialBuyIn: 100,
          totalPot: 200,
          rebuys: []
        },
        players: []
      };

      expect(() => calculateGameResults(game))
        .toThrow('No chip configuration found');
    });

    it('should handle game with no players', () => {
      const game: IGame = {
        groupCode: 'ABC123',
        createdAt: new Date(),
        status: 'completed',
        leaderId: 'leader1',
        chipConfig: {
          colors: standardChipConfig
        },
        financials: {
          initialBuyIn: 100,
          totalPot: 0,
          rebuys: []
        },
        players: []
      };

      expect(() => calculateGameResults(game))
        .toThrow('No players found');
    });
  });

  describe('Edge Cases and Stress Tests', () => {
    it('should handle 10 players with varied outcomes', () => {
      // Create a realistic scenario where some players win and some lose
      const players: IPlayer[] = [
        // Winners
        { name: 'Player1', initialChips: {}, currentChips: { Black: 2, Green: 8 }, totalBuyIn: 100 }, // 400 chips
        { name: 'Player2', initialChips: {}, currentChips: { Black: 1, Green: 6 }, totalBuyIn: 100 }, // 250 chips
        { name: 'Player3', initialChips: {}, currentChips: { Green: 5, Red: 10 }, totalBuyIn: 100 }, // 175 chips
        // Small winners/losers
        { name: 'Player4', initialChips: {}, currentChips: { Green: 4, Red: 5 }, totalBuyIn: 100 }, // 125 chips
        { name: 'Player5', initialChips: {}, currentChips: { Green: 3, Red: 5 }, totalBuyIn: 100 }, // 100 chips
        { name: 'Player6', initialChips: {}, currentChips: { Green: 2, Red: 10 }, totalBuyIn: 100 }, // 100 chips
        { name: 'Player7', initialChips: {}, currentChips: { Green: 2, Red: 5 }, totalBuyIn: 100 }, // 75 chips
        // Losers
        { name: 'Player8', initialChips: {}, currentChips: { Red: 10 }, totalBuyIn: 100 }, // 50 chips
        { name: 'Player9', initialChips: {}, currentChips: { Red: 5 }, totalBuyIn: 100 }, // 25 chips
        { name: 'Player10', initialChips: {}, currentChips: {}, totalBuyIn: 100 }, // 0 chips
      ];

      const game: IGame = {
        groupCode: 'TEST10',
        createdAt: new Date(),
        status: 'completed',
        leaderId: 'leader1',
        chipConfig: {
          colors: standardChipConfig
        },
        financials: {
          initialBuyIn: 100,
          totalPot: 1000,
          rebuys: []
        },
        players
      };

      const results = calculateGameResults(game);

      expect(results.playerEarnings).toHaveLength(10);
      expect(results.venmoPayments.length).toBeGreaterThan(0);
      
      // Verify no player appears in conflicting payment directions
      results.venmoPayments.forEach(payment => {
        const reversePayment = results.venmoPayments.find(
          p => p.from === payment.to && p.to === payment.from
        );
        expect(reversePayment).toBeUndefined();
      });
    });

    it('should handle fractional chip values', () => {
      const fractionalChipConfig: IChipColor[] = [
        { name: 'Quarter', value: 0.25 },
        { name: 'Half', value: 0.50 },
        { name: 'Dollar', value: 1 }
      ];

      const player: IPlayer = {
        name: 'FractionPlayer',
        initialChips: {},
        currentChips: { Quarter: 7, Half: 5, Dollar: 3 },
        totalBuyIn: 5
      };

      const earnings = calculatePlayerEarnings(player, fractionalChipConfig);

      expect(earnings.chipValue).toBe(7.25); // 7*0.25 + 5*0.5 + 3*1
      expect(earnings.netEarnings).toBe(2.25);
    });
  });
});