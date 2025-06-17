// Utility functions for handling money calculations with precision

/**
 * Rounds a number to 2 decimal places (cents precision)
 * Uses Math.round to avoid floating point precision issues
 */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Formats a number as USD currency
 * @param amount - The amount in dollars
 * @param includeSign - Whether to include the $ sign (default: true)
 */
export function formatCurrency(amount: number, includeSign: boolean = true): string {
  const rounded = roundMoney(amount);
  const formatted = rounded.toFixed(2);
  return includeSign ? `$${formatted}` : formatted;
}

/**
 * Adds two money amounts safely, avoiding floating point errors
 */
export function addMoney(a: number, b: number): number {
  return roundMoney(a + b);
}

/**
 * Subtracts two money amounts safely, avoiding floating point errors
 */
export function subtractMoney(a: number, b: number): number {
  return roundMoney(a - b);
}

/**
 * Multiplies money by a quantity safely
 */
export function multiplyMoney(amount: number, quantity: number): number {
  return roundMoney(amount * quantity);
}

/**
 * Checks if two money amounts are equal within a small epsilon
 * Useful for comparing calculated totals
 */
export function areMoneyAmountsEqual(a: number, b: number, epsilon: number = 0.01): boolean {
  return Math.abs(a - b) < epsilon;
}

/**
 * Validates that a money amount is valid (non-negative, finite number)
 */
export function isValidMoneyAmount(amount: number): boolean {
  return typeof amount === 'number' && 
         !isNaN(amount) && 
         isFinite(amount) && 
         amount >= 0;
}

/**
 * Sums an array of money amounts safely
 */
export function sumMoney(amounts: number[]): number {
  return amounts.reduce((sum, amount) => addMoney(sum, amount), 0);
}