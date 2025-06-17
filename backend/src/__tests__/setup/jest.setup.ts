import { jest } from '@jest/globals';

// Increase test timeout for integration tests
jest.setTimeout(30000);

// Silence console during tests unless explicitly needed
global.console = {
  ...console,
  // Keep error and warn to catch issues
  error: console.error,
  warn: console.warn,
  // Silence other console methods during tests
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Add custom matchers if needed
expect.extend({
  toBeValidId(received: any) {
    const pass = typeof received === 'string' && /^[0-9a-fA-F]{24}$/.test(received);
    return {
      pass,
      message: () => 
        pass
          ? `expected ${received} not to be a valid MongoDB ObjectId`
          : `expected ${received} to be a valid MongoDB ObjectId`,
    };
  },
});

// Global type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidId(): R;
    }
  }
}

// Export to make this a module
export {};