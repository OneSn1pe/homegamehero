// Specialized tests for Venmo payment optimization algorithm

import { generateVenmoMap } from '../services/calculationService';
import { PayoutResult } from '../types/calculations';

describe('Venmo Payment Optimization', () => {
  describe('Transaction Minimization', () => {
    it('should use single transaction for 2-player zero-sum game', () => {
      const payouts: PayoutResult[] = [
        { name: 'Alice', chipValue: 150, buyIn: 100, finalPayout: 150, netGain: 50 },
        { name: 'Bob', chipValue: 50, buyIn: 100, finalPayout: 50, netGain: -50 }
      ];

      const payments = generateVenmoMap(payouts);

      expect(payments).toHaveLength(1);
      expect(payments[0]).toEqual({
        from: 'Bob',
        to: 'Alice',
        amount: 50,
        note: 'Poker game settlement'
      });
    });

    it('should minimize transactions for 3 players (1 winner, 2 losers)', () => {
      const payouts: PayoutResult[] = [
        { name: 'Winner', chipValue: 300, buyIn: 100, finalPayout: 300, netGain: 200 },
        { name: 'Loser1', chipValue: 50, buyIn: 100, finalPayout: 50, netGain: -50 },
        { name: 'Loser2', chipValue: 50, buyIn: 100, finalPayout: 50, netGain: -150 }
      ];

      const payments = generateVenmoMap(payouts);

      expect(payments).toHaveLength(2); // Optimal: each loser pays winner once
      expect(payments.every(p => p.to === 'Winner')).toBe(true);
    });

    it('should minimize transactions for 3 players (2 winners, 1 loser)', () => {
      const payouts: PayoutResult[] = [
        { name: 'Winner1', chipValue: 150, buyIn: 100, finalPayout: 150, netGain: 50 },
        { name: 'Winner2', chipValue: 200, buyIn: 100, finalPayout: 200, netGain: 100 },
        { name: 'Loser', chipValue: 50, buyIn: 200, finalPayout: 50, netGain: -150 }
      ];

      const payments = generateVenmoMap(payouts);

      expect(payments).toHaveLength(2); // Optimal: loser pays each winner
      expect(payments.every(p => p.from === 'Loser')).toBe(true);
      
      // Should pay larger winner first
      expect(payments[0]?.to).toBe('Winner2');
      expect(payments[0]?.amount).toBe(100);
      expect(payments[1]?.to).toBe('Winner1');
      expect(payments[1]?.amount).toBe(50);
    });

    it('should handle 4-player balanced scenario optimally', () => {
      const payouts: PayoutResult[] = [
        { name: 'A', chipValue: 200, buyIn: 100, finalPayout: 200, netGain: 100 },
        { name: 'B', chipValue: 150, buyIn: 100, finalPayout: 150, netGain: 50 },
        { name: 'C', chipValue: 50, buyIn: 100, finalPayout: 50, netGain: -50 },
        { name: 'D', chipValue: 0, buyIn: 100, finalPayout: 0, netGain: -100 }
      ];

      const payments = generateVenmoMap(payouts);

      // Optimal solution: D pays A $100, C pays B $50
      expect(payments).toHaveLength(2);
      
      const dPayment = payments.find(p => p.from === 'D');
      expect(dPayment).toEqual({
        from: 'D',
        to: 'A',
        amount: 100,
        note: 'Poker game settlement'
      });

      const cPayment = payments.find(p => p.from === 'C');
      expect(cPayment).toEqual({
        from: 'C',
        to: 'B',
        amount: 50,
        note: 'Poker game settlement'
      });
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle asymmetric multi-winner, multi-loser case', () => {
      const payouts: PayoutResult[] = [
        { name: 'BigWinner', chipValue: 400, buyIn: 100, finalPayout: 400, netGain: 300 },
        { name: 'MedWinner', chipValue: 150, buyIn: 100, finalPayout: 150, netGain: 50 },
        { name: 'SmallWinner', chipValue: 120, buyIn: 100, finalPayout: 120, netGain: 20 },
        { name: 'SmallLoser', chipValue: 70, buyIn: 100, finalPayout: 70, netGain: -30 },
        { name: 'MedLoser', chipValue: 20, buyIn: 100, finalPayout: 20, netGain: -80 },
        { name: 'BigLoser', chipValue: 40, buyIn: 300, finalPayout: 40, netGain: -260 }
      ];

      const payments = generateVenmoMap(payouts);

      // Verify total conservation
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      expect(totalPaid).toBe(370); // Sum of all winnings

      // Should prioritize largest amounts first
      const bigLoserPayments = payments.filter(p => p.from === 'BigLoser');
      expect(bigLoserPayments[0]?.to).toBe('BigWinner');
      
      // No more than 5 transactions needed (less than n-1 for 6 players)
      expect(payments.length).toBeLessThanOrEqual(5);
    });

    it('should handle many small winners and few big losers', () => {
      const payouts: PayoutResult[] = [
        { name: 'W1', chipValue: 110, buyIn: 100, finalPayout: 110, netGain: 10 },
        { name: 'W2', chipValue: 115, buyIn: 100, finalPayout: 115, netGain: 15 },
        { name: 'W3', chipValue: 120, buyIn: 100, finalPayout: 120, netGain: 20 },
        { name: 'W4', chipValue: 125, buyIn: 100, finalPayout: 125, netGain: 25 },
        { name: 'W5', chipValue: 130, buyIn: 100, finalPayout: 130, netGain: 30 },
        { name: 'L1', chipValue: 50, buyIn: 100, finalPayout: 50, netGain: -50 },
        { name: 'L2', chipValue: 50, buyIn: 100, finalPayout: 50, netGain: -50 }
      ];

      const payments = generateVenmoMap(payouts);

      // Should be efficiently distributed
      expect(payments.length).toBeLessThanOrEqual(6);
      
      // Each loser should make multiple payments
      const l1Payments = payments.filter(p => p.from === 'L1');
      const l2Payments = payments.filter(p => p.from === 'L2');
      expect(l1Payments.length).toBeGreaterThan(1);
      expect(l2Payments.length).toBeGreaterThan(1);
    });

    it('should handle one big winner and many small losers', () => {
      const payouts: PayoutResult[] = [
        { name: 'BigWinner', chipValue: 600, buyIn: 100, finalPayout: 600, netGain: 500 },
        { name: 'L1', chipValue: 0, buyIn: 100, finalPayout: 0, netGain: -100 },
        { name: 'L2', chipValue: 0, buyIn: 100, finalPayout: 0, netGain: -100 },
        { name: 'L3', chipValue: 0, buyIn: 100, finalPayout: 0, netGain: -100 },
        { name: 'L4', chipValue: 0, buyIn: 100, finalPayout: 0, netGain: -100 },
        { name: 'L5', chipValue: 0, buyIn: 100, finalPayout: 0, netGain: -100 }
      ];

      const payments = generateVenmoMap(payouts);

      expect(payments).toHaveLength(5); // Each loser pays winner exactly once
      expect(payments.every(p => p.to === 'BigWinner')).toBe(true);
      expect(payments.every(p => p.amount === 100)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle all break-even players', () => {
      const payouts: PayoutResult[] = [
        { name: 'P1', chipValue: 100, buyIn: 100, finalPayout: 100, netGain: 0 },
        { name: 'P2', chipValue: 100, buyIn: 100, finalPayout: 100, netGain: 0 },
        { name: 'P3', chipValue: 100, buyIn: 100, finalPayout: 100, netGain: 0 },
        { name: 'P4', chipValue: 100, buyIn: 100, finalPayout: 100, netGain: 0 }
      ];

      const payments = generateVenmoMap(payouts);

      expect(payments).toHaveLength(0);
    });

    it('should handle single player scenarios', () => {
      const payouts: PayoutResult[] = [
        { name: 'SoloPlayer', chipValue: 100, buyIn: 100, finalPayout: 100, netGain: 0 }
      ];

      const payments = generateVenmoMap(payouts);

      expect(payments).toHaveLength(0);
    });

    it('should handle micro-stakes with proper rounding', () => {
      const payouts: PayoutResult[] = [
        { name: 'A', chipValue: 10.67, buyIn: 10, finalPayout: 10.67, netGain: 0.67 },
        { name: 'B', chipValue: 10.33, buyIn: 10, finalPayout: 10.33, netGain: 0.33 },
        { name: 'C', chipValue: 9.50, buyIn: 10, finalPayout: 9.50, netGain: -0.50 },
        { name: 'D', chipValue: 9.50, buyIn: 10, finalPayout: 9.50, netGain: -0.50 }
      ];

      const payments = generateVenmoMap(payouts);

      // Algorithm prioritizes larger amounts first, may create more than 2 payments
      expect(payments.length).toBeGreaterThanOrEqual(2);
      expect(payments.length).toBeLessThanOrEqual(4);
      
      // Verify amounts are properly rounded
      payments.forEach(payment => {
        expect(payment.amount).toBe(Number(payment.amount.toFixed(2)));
      });

      // Total should balance (within rounding tolerance)
      const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
      expect(Math.abs(totalPaid - 1.00)).toBeLessThan(0.02);
    });

    it('should skip payments below $0.01 threshold', () => {
      const payouts: PayoutResult[] = [
        { name: 'A', chipValue: 100.008, buyIn: 100, finalPayout: 100.008, netGain: 0.008 },
        { name: 'B', chipValue: 100.002, buyIn: 100, finalPayout: 100.002, netGain: 0.002 },
        { name: 'C', chipValue: 99.995, buyIn: 100, finalPayout: 99.995, netGain: -0.005 },
        { name: 'D', chipValue: 99.995, buyIn: 100, finalPayout: 99.995, netGain: -0.005 }
      ];

      const payments = generateVenmoMap(payouts);

      expect(payments).toHaveLength(0); // All amounts below threshold
    });
  });

  describe('Algorithm Correctness', () => {
    it('should never create circular payments', () => {
      const payouts: PayoutResult[] = [
        { name: 'A', chipValue: 150, buyIn: 100, finalPayout: 150, netGain: 50 },
        { name: 'B', chipValue: 120, buyIn: 100, finalPayout: 120, netGain: 20 },
        { name: 'C', chipValue: 80, buyIn: 100, finalPayout: 80, netGain: -20 },
        { name: 'D', chipValue: 50, buyIn: 100, finalPayout: 50, netGain: -50 }
      ];

      const payments = generateVenmoMap(payouts);

      // Check no player both sends and receives
      const senders = new Set(payments.map(p => p.from));
      const receivers = new Set(payments.map(p => p.to));
      const intersection = [...senders].filter(x => receivers.has(x));
      
      expect(intersection).toHaveLength(0);
    });

    it('should always balance total payments with total winnings', () => {
      // Generate random test case
      const playerCount = 8;
      const buyIn = 100;
      const totalPot = playerCount * buyIn;
      
      // Distribute chips randomly but ensuring total equals pot
      let remainingPot = totalPot;
      const payouts: PayoutResult[] = [];
      
      for (let i = 0; i < playerCount - 1; i++) {
        const maxChips = Math.min(remainingPot, buyIn * 2);
        const chipValue = Math.random() * maxChips;
        const rounded = Math.round(chipValue * 100) / 100;
        
        payouts.push({
          name: `Player${i + 1}`,
          chipValue: rounded,
          buyIn: buyIn,
          finalPayout: rounded,
          netGain: rounded - buyIn
        });
        
        remainingPot -= rounded;
      }
      
      // Last player gets remaining
      payouts.push({
        name: `Player${playerCount}`,
        chipValue: remainingPot,
        buyIn: buyIn,
        finalPayout: remainingPot,
        netGain: remainingPot - buyIn
      });

      const payments = generateVenmoMap(payouts);

      // Calculate totals
      const totalWinnings = payouts
        .filter(p => p.netGain > 0)
        .reduce((sum, p) => sum + p.netGain, 0);
        
      const totalLosses = payouts
        .filter(p => p.netGain < 0)
        .reduce((sum, p) => sum + Math.abs(p.netGain), 0);
        
      const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);

      // Verify balance
      expect(Math.abs(totalWinnings - totalLosses)).toBeLessThan(0.01);
      expect(Math.abs(totalPayments - totalWinnings)).toBeLessThan(0.01);
    });

    it('should produce consistent results for same input', () => {
      const payouts: PayoutResult[] = [
        { name: 'A', chipValue: 200, buyIn: 100, finalPayout: 200, netGain: 100 },
        { name: 'B', chipValue: 150, buyIn: 100, finalPayout: 150, netGain: 50 },
        { name: 'C', chipValue: 50, buyIn: 100, finalPayout: 50, netGain: -50 },
        { name: 'D', chipValue: 0, buyIn: 100, finalPayout: 0, netGain: -100 }
      ];

      // Run multiple times
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(generateVenmoMap([...payouts]));
      }

      // All results should be identical
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toEqual(results[0]);
      }
    });
  });

  describe('Performance Tests', () => {
    it('should handle 20 players efficiently', () => {
      const players = 20;
      const payouts: PayoutResult[] = [];
      
      // Create a mix of winners and losers
      for (let i = 0; i < players; i++) {
        const isWinner = i < players / 2;
        const netGain = isWinner ? (i + 1) * 10 : -(i - players/2 + 1) * 10;
        
        payouts.push({
          name: `Player${i + 1}`,
          chipValue: 100 + netGain,
          buyIn: 100,
          finalPayout: 100 + netGain,
          netGain: netGain
        });
      }

      const startTime = Date.now();
      const payments = generateVenmoMap(payouts);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete in < 100ms
      expect(payments.length).toBeLessThan(players); // Should optimize transactions
    });

    it('should handle extreme imbalances efficiently', () => {
      const payouts: PayoutResult[] = [
        { name: 'MegaWinner', chipValue: 10000, buyIn: 100, finalPayout: 10000, netGain: 9900 }
      ];

      // Add 99 small losers
      for (let i = 1; i < 100; i++) {
        payouts.push({
          name: `Loser${i}`,
          chipValue: 0,
          buyIn: 100,
          finalPayout: 0,
          netGain: -100
        });
      }

      const payments = generateVenmoMap(payouts);

      expect(payments).toHaveLength(99); // Each loser pays winner once
      expect(payments.every(p => p.to === 'MegaWinner')).toBe(true);
      expect(payments.every(p => p.amount === 100)).toBe(true);
    });
  });
});