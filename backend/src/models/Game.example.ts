/**
 * Example usage of the Game model
 * This file demonstrates how to create, update, and query games
 */

import { Game, IGame } from '../models';
import { generateUniqueGroupCode } from '../utils/groupCode';

// Example: Create a new game
export const createGameExample = async () => {
  const groupCode = await generateUniqueGroupCode();
  
  const newGame: Partial<IGame> = {
    groupCode,
    leaderId: 'user123',
    status: 'setup',
    chipConfig: {
      colors: [
        { name: 'White', value: 1 },
        { name: 'Red', value: 5 },
        { name: 'Green', value: 25 },
        { name: 'Black', value: 100 }
      ]
    },
    financials: {
      initialBuyIn: 50,
      totalPot: 200, // 4 players * $50
      rebuys: []
    },
    players: [
      {
        name: 'Alice',
        initialChips: { 'White': 20, 'Red': 8, 'Green': 1 },
        currentChips: { 'White': 15, 'Red': 10, 'Green': 2 },
        totalBuyIn: 50
      },
      {
        name: 'Bob',
        initialChips: { 'White': 20, 'Red': 8, 'Green': 1 },
        currentChips: { 'White': 25, 'Red': 6, 'Green': 1 },
        totalBuyIn: 50
      },
      {
        name: 'Charlie',
        initialChips: { 'White': 20, 'Red': 8, 'Green': 1 },
        currentChips: { 'White': 10, 'Red': 12, 'Green': 0 },
        totalBuyIn: 50
      },
      {
        name: 'Diana',
        initialChips: { 'White': 20, 'Red': 8, 'Green': 1 },
        currentChips: { 'White': 30, 'Red': 4, 'Green': 2 },
        totalBuyIn: 50
      }
    ]
  };
  
  const game = new Game(newGame);
  return await game.save();
};

// Example: Find game by group code
export const findGameByCodeExample = async (code: string) => {
  return await Game.findByGroupCode(code);
};

// Example: Update game status
export const updateGameStatusExample = async (gameId: string, status: 'setup' | 'active' | 'completed') => {
  return await Game.findByIdAndUpdate(
    gameId,
    { status },
    { new: true }
  );
};

// Example: Add a rebuy
export const addRebuyExample = async (gameId: string, playerName: string, amount: number) => {
  const game = await Game.findById(gameId);
  if (!game) throw new Error('Game not found');
  
  // Find the player
  const player = game.players.find(p => p.name === playerName);
  if (!player) throw new Error('Player not found');
  
  // Add rebuy to financials
  game.financials.rebuys.push({
    playerName,
    amount,
    chipsByColor: { 'White': 20, 'Red': 8, 'Green': 1 }, // Example chip distribution
    timestamp: new Date()
  });
  
  // Update player's total buy-in
  player.totalBuyIn += amount;
  
  // Update total pot
  game.financials.totalPot += amount;
  
  return await game.save();
};

// Example: Update player chip counts
export const updatePlayerChipsExample = async (
  gameId: string, 
  playerName: string, 
  newChips: Record<string, number>
) => {
  const game = await Game.findById(gameId);
  if (!game) throw new Error('Game not found');
  
  const player = game.players.find(p => p.name === playerName);
  if (!player) throw new Error('Player not found');
  
  player.currentChips = newChips;
  
  return await game.save();
};

// Example: Get active games
export const getActiveGamesExample = async () => {
  return await Game.find({ status: 'active' })
    .sort({ createdAt: -1 })
    .limit(10);
};

// Example: Clean up old completed games
export const cleanupOldGamesExample = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  return await Game.deleteMany({
    status: 'completed',
    createdAt: { $lt: thirtyDaysAgo }
  });
};