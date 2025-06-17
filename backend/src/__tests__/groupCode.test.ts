import { generateUniqueGroupCode, isValidGroupCode, formatGroupCode } from '../../utils/groupCode';
import Game from '../../models/Game';

// Mock the Game model
jest.mock('../../models/Game');

describe('Group Code Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateUniqueGroupCode', () => {
    it('should generate a 6-character uppercase code', async () => {
      // Mock findByGroupCode to return null (code doesn't exist)
      (Game.findByGroupCode as jest.Mock).mockResolvedValue(null);

      const code = await generateUniqueGroupCode();
      
      expect(code).toHaveLength(6);
      expect(code).toMatch(/^[A-Z0-9]{6}$/);
      expect(code).not.toMatch(/[0OIL]/); // Should not contain ambiguous characters
    });

    it('should retry if code already exists', async () => {
      // First call returns existing game, second returns null
      (Game.findByGroupCode as jest.Mock)
        .mockResolvedValueOnce({ groupCode: 'ABC123' })
        .mockResolvedValueOnce(null);

      const code = await generateUniqueGroupCode();
      
      expect(code).toHaveLength(6);
      expect(Game.findByGroupCode).toHaveBeenCalledTimes(2);
    });

    it('should throw error after max attempts', async () => {
      // Always return existing game
      (Game.findByGroupCode as jest.Mock).mockResolvedValue({ groupCode: 'EXISTS' });

      await expect(generateUniqueGroupCode()).rejects.toThrow(
        'Failed to generate unique group code after maximum attempts'
      );
      
      expect(Game.findByGroupCode).toHaveBeenCalledTimes(10);
    });
  });

  describe('isValidGroupCode', () => {
    it('should return true for valid codes', () => {
      expect(isValidGroupCode('ABC123')).toBe(true);
      expect(isValidGroupCode('XYZ789')).toBe(true);
      expect(isValidGroupCode('123456')).toBe(true);
      expect(isValidGroupCode('ABCDEF')).toBe(true);
    });

    it('should return false for invalid codes', () => {
      expect(isValidGroupCode('ABC12')).toBe(false); // Too short
      expect(isValidGroupCode('ABC1234')).toBe(false); // Too long
      expect(isValidGroupCode('ABC12!')).toBe(false); // Special character
      expect(isValidGroupCode('abc123')).toBe(false); // Lowercase (but would work with uppercase)
      expect(isValidGroupCode('')).toBe(false); // Empty
    });

    it('should handle lowercase input', () => {
      expect(isValidGroupCode('abc123')).toBe(false); // Validation expects uppercase
      // But the code can be converted to uppercase before validation in actual use
    });
  });

  describe('formatGroupCode', () => {
    it('should format code with hyphen', () => {
      expect(formatGroupCode('ABC123')).toBe('ABC-123');
      expect(formatGroupCode('XYZ789')).toBe('XYZ-789');
    });

    it('should return unchanged if not 6 characters', () => {
      expect(formatGroupCode('ABC')).toBe('ABC');
      expect(formatGroupCode('ABCDEFG')).toBe('ABCDEFG');
      expect(formatGroupCode('')).toBe('');
    });
  });
});