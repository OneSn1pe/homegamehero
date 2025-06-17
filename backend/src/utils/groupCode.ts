import Game from '../models/Game';

/**
 * Generate a random 6-digit alphanumeric code
 * Excludes ambiguous characters: 0, O, I, L to improve readability
 */
const generateRandomCode = (): string => {
  const characters = 'ABCDEFGHJKMNPQRSTUVWXYZ123456789';
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  
  return code;
};

/**
 * Generate a unique 6-digit group code
 * Ensures the code doesn't already exist in the database
 */
export const generateUniqueGroupCode = async (): Promise<string> => {
  const maxAttempts = 10;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const code = generateRandomCode();
    
    // Check if this code already exists
    const existingGame = await Game.findByGroupCode(code);
    
    if (!existingGame) {
      return code;
    }
    
    attempts++;
  }
  
  // If we've exhausted attempts, throw an error
  throw new Error('Failed to generate unique group code after maximum attempts');
};

/**
 * Validate if a group code is in the correct format
 */
export const isValidGroupCode = (code: string): boolean => {
  // Check if it's exactly 6 characters
  if (code.length !== 6) {
    return false;
  }
  
  // Check if it contains only allowed alphanumeric characters
  const validPattern = /^[A-Z0-9]{6}$/;
  return validPattern.test(code.toUpperCase());
};

/**
 * Format a group code for display (adds spacing for readability)
 */
export const formatGroupCode = (code: string): string => {
  if (code.length !== 6) {
    return code;
  }
  
  // Format as XXX-XXX for better readability
  return `${code.slice(0, 3)}-${code.slice(3)}`;
};