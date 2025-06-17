// Unit tests for money utility functions

import {
  roundMoney,
  formatCurrency,
  addMoney,
  subtractMoney,
  multiplyMoney,
  areMoneyAmountsEqual,
  isValidMoneyAmount,
  sumMoney
} from '../../utils/money';

describe('Money Utilities', () => {
  describe('roundMoney', () => {
    it('should round to 2 decimal places', () => {
      expect(roundMoney(1.234)).toBe(1.23);
      expect(roundMoney(1.235)).toBe(1.24);
      expect(roundMoney(1.236)).toBe(1.24);
      expect(roundMoney(1.999)).toBe(2.00);
    });

    it('should handle negative numbers', () => {
      expect(roundMoney(-1.234)).toBe(-1.23);
      expect(roundMoney(-1.235)).toBe(-1.24); // Standard rounding
      expect(roundMoney(-1.236)).toBe(-1.24);
    });

    it('should handle very small numbers', () => {
      expect(roundMoney(0.001)).toBe(0.00);
      expect(roundMoney(0.005)).toBe(0.01);
      expect(roundMoney(0.009)).toBe(0.01);
    });
  });

  describe('formatCurrency', () => {
    it('should format with $ sign by default', () => {
      expect(formatCurrency(1.23)).toBe('$1.23');
      expect(formatCurrency(100)).toBe('$100.00');
      expect(formatCurrency(0)).toBe('$0.00');
    });

    it('should format without $ sign when requested', () => {
      expect(formatCurrency(1.23, false)).toBe('1.23');
      expect(formatCurrency(100, false)).toBe('100.00');
      expect(formatCurrency(0, false)).toBe('0.00');
    });

    it('should handle rounding', () => {
      expect(formatCurrency(1.234)).toBe('$1.23');
      expect(formatCurrency(1.999)).toBe('$2.00');
    });
  });

  describe('addMoney', () => {
    it('should add two amounts safely', () => {
      expect(addMoney(0.1, 0.2)).toBe(0.3);
      expect(addMoney(10.50, 20.75)).toBe(31.25);
      expect(addMoney(100, 200)).toBe(300);
    });

    it('should handle floating point precision issues', () => {
      // Classic JS floating point issue: 0.1 + 0.2 = 0.30000000000000004
      expect(addMoney(0.1, 0.2)).toBe(0.3);
      expect(addMoney(1.13, 2.47)).toBe(3.6);
    });
  });

  describe('subtractMoney', () => {
    it('should subtract two amounts safely', () => {
      expect(subtractMoney(0.3, 0.1)).toBe(0.2);
      expect(subtractMoney(31.25, 20.75)).toBe(10.5);
      expect(subtractMoney(300, 200)).toBe(100);
    });

    it('should handle negative results', () => {
      expect(subtractMoney(10, 20)).toBe(-10);
      expect(subtractMoney(5.25, 10.50)).toBe(-5.25);
    });
  });

  describe('multiplyMoney', () => {
    it('should multiply amount by quantity', () => {
      expect(multiplyMoney(5.25, 4)).toBe(21);
      expect(multiplyMoney(0.25, 7)).toBe(1.75);
      expect(multiplyMoney(100, 0.15)).toBe(15); // 15% of 100
    });

    it('should handle zero', () => {
      expect(multiplyMoney(100, 0)).toBe(0);
      expect(multiplyMoney(0, 100)).toBe(0);
    });
  });

  describe('areMoneyAmountsEqual', () => {
    it('should return true for equal amounts', () => {
      expect(areMoneyAmountsEqual(10, 10)).toBe(true);
      expect(areMoneyAmountsEqual(10.25, 10.25)).toBe(true);
    });

    it('should return true for amounts within epsilon', () => {
      expect(areMoneyAmountsEqual(10, 10.005)).toBe(true);
      expect(areMoneyAmountsEqual(10, 9.995)).toBe(true);
    });

    it('should return false for amounts outside epsilon', () => {
      expect(areMoneyAmountsEqual(10, 10.02)).toBe(false);
      expect(areMoneyAmountsEqual(10, 9.98)).toBe(false);
    });

    it('should use custom epsilon', () => {
      expect(areMoneyAmountsEqual(10, 10.1, 0.2)).toBe(true);
      expect(areMoneyAmountsEqual(10, 10.3, 0.2)).toBe(false);
    });
  });

  describe('isValidMoneyAmount', () => {
    it('should validate positive numbers', () => {
      expect(isValidMoneyAmount(0)).toBe(true);
      expect(isValidMoneyAmount(10)).toBe(true);
      expect(isValidMoneyAmount(10.25)).toBe(true);
      expect(isValidMoneyAmount(1000000)).toBe(true);
    });

    it('should reject negative numbers', () => {
      expect(isValidMoneyAmount(-1)).toBe(false);
      expect(isValidMoneyAmount(-0.01)).toBe(false);
    });

    it('should reject invalid values', () => {
      expect(isValidMoneyAmount(NaN)).toBe(false);
      expect(isValidMoneyAmount(Infinity)).toBe(false);
      expect(isValidMoneyAmount(-Infinity)).toBe(false);
      expect(isValidMoneyAmount(undefined as any)).toBe(false);
      expect(isValidMoneyAmount(null as any)).toBe(false);
      expect(isValidMoneyAmount('10' as any)).toBe(false);
    });
  });

  describe('sumMoney', () => {
    it('should sum array of amounts', () => {
      expect(sumMoney([1, 2, 3])).toBe(6);
      expect(sumMoney([10.25, 20.50, 30.75])).toBe(61.5);
      expect(sumMoney([0.1, 0.2, 0.3])).toBe(0.6);
    });

    it('should handle empty array', () => {
      expect(sumMoney([])).toBe(0);
    });

    it('should handle single element', () => {
      expect(sumMoney([100])).toBe(100);
    });

    it('should handle floating point precision', () => {
      // Should sum to exactly 1, not 0.9999999999999999
      expect(sumMoney([0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1])).toBe(1);
    });
  });
});