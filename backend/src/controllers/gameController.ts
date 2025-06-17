import { Request, Response } from 'express';
import Game from '../models/Game';
import { Player } from '../models/Player';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import { generateLeaderToken } from '../middleware/auth';
import { socketService } from '../index';
import {
  CreateGameRequest,
  CreateGameResponse,
  GetGameResponse,
  UpdateChipsRequest,
  UpdateChipsResponse,
  AddRebuyRequest,
  AddRebuyResponse,
  EndGameRequest,
  EndGameResponse,
} from '../types/api';

// Generate a unique 6-character game code
const generateGameCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Create a new game
export const createGame = asyncHandler(
  async (req: Request<{}, {}, CreateGameRequest>, res: Response<CreateGameResponse>) => {
    const { hostName, buyIn, chipValues, blindStructure } = req.body;

    // Generate unique game code
    let code: string;
    let codeExists = true;
    
    while (codeExists) {
      code = generateGameCode();
      const existingGame = await Game.findOne({ code });
      codeExists = !!existingGame;
    }

    // Create the game
    const game = await Game.create({
      code: code!,
      hostName,
      buyIn,
      chipValues,
      blindStructure,
      currentBlindLevel: 0,
      status: 'waiting',
    });

    // Generate leader token for the game creator
    const leaderToken = generateLeaderToken(
      game._id.toString(),
      game.code,
      game.hostName
    );

    res.status(201).json({
      success: true,
      data: {
        gameId: game._id.toString(),
        code: game.code,
        hostName: game.hostName,
        buyIn: game.buyIn,
        chipValues: game.chipValues,
        blindStructure: game.blindStructure,
        status: game.status,
        createdAt: game.createdAt,
        leaderToken,
      },
    });
  }
);

// Get game by code
export const getGame = asyncHandler(
  async (req: Request<{ code: string }>, res: Response<GetGameResponse>) => {
    const { code } = req.params;

    const game = await Game.findOne({ code }).populate('players');

    if (!game) {
      throw new AppError('Game not found', 404);
    }

    const players = game.players.map((player: any) => ({
      playerId: player._id.toString(),
      name: player.name,
      currentChips: player.currentChips,
      totalBuyIn: player.totalBuyIn,
      rebuys: player.rebuys,
      status: player.status,
    }));

    const totalPot = players.reduce((sum: number, player) => sum + player.totalBuyIn, 0);

    res.json({
      success: true,
      data: {
        gameId: game._id.toString(),
        code: game.code,
        hostName: game.hostName,
        buyIn: game.buyIn,
        chipValues: game.chipValues,
        blindStructure: game.blindStructure,
        players,
        currentBlindLevel: game.currentBlindLevel,
        totalPot,
        status: game.status,
        startTime: game.startTime,
        endTime: game.endTime,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
      },
    });
  }
);

// Update player's chips
export const updateChips = asyncHandler(
  async (req: Request<{ id: string }, {}, UpdateChipsRequest>, res: Response<UpdateChipsResponse>) => {
    const { id: gameId } = req.params;
    const { playerId, chips } = req.body;

    // Verify game exists and is active
    const game = await Game.findById(gameId);
    if (!game) {
      throw new AppError('Game not found', 404);
    }

    if (game.status === 'completed') {
      throw new AppError('Cannot update chips in a completed game', 400);
    }

    // Update player's chips
    const player = await Player.findOneAndUpdate(
      { _id: playerId, gameId },
      { currentChips: chips },
      { new: true, runValidators: true }
    );

    if (!player) {
      throw new AppError('Player not found in this game', 404);
    }

    res.json({
      success: true,
      data: {
        playerId: player._id.toString(),
        name: player.name,
        currentChips: player.currentChips,
        totalBuyIn: player.totalBuyIn,
        rebuys: player.rebuys,
        status: player.status,
      },
    });
  }
);

// Add rebuy for a player
export const addRebuy = asyncHandler(
  async (req: Request<{ id: string }, {}, AddRebuyRequest>, res: Response<AddRebuyResponse>) => {
    const { id: gameId } = req.params;
    const { playerId, amount } = req.body;

    // Verify game exists and is active
    const game = await Game.findById(gameId);
    if (!game) {
      throw new AppError('Game not found', 404);
    }

    if (game.status !== 'active') {
      throw new AppError('Can only add rebuys to active games', 400);
    }

    // Update player's rebuy information
    const player = await Player.findOneAndUpdate(
      { _id: playerId, gameId },
      { 
        $inc: { 
          rebuys: 1,
          totalBuyIn: amount,
          currentChips: amount
        }
      },
      { new: true, runValidators: true }
    );

    if (!player) {
      throw new AppError('Player not found in this game', 404);
    }

    res.json({
      success: true,
      data: {
        playerId: player._id.toString(),
        name: player.name,
        currentChips: player.currentChips,
        totalBuyIn: player.totalBuyIn,
        rebuys: player.rebuys,
        status: player.status,
      },
    });
  }
);

// End game and calculate payouts
export const endGame = asyncHandler(
  async (req: Request<{ id: string }, {}, EndGameRequest>, res: Response<EndGameResponse>) => {
    const { id: gameId } = req.params;
    const { rankings } = req.body;

    // Verify game exists and is active
    const game = await Game.findById(gameId).populate('players');
    if (!game) {
      throw new AppError('Game not found', 404);
    }

    if (game.status === 'completed') {
      throw new AppError('Game is already completed', 400);
    }

    // Calculate total pot
    const players = game.players as any[];
    const totalPot = players.reduce((sum: number, player) => sum + player.totalBuyIn, 0);

    // Update player statuses and calculate final rankings
    const finalRankings = await Promise.all(
      rankings.map(async (ranking) => {
        const player = await Player.findOneAndUpdate(
          { _id: ranking.playerId, gameId },
          { 
            status: 'eliminated',
            finalPosition: ranking.position,
            payout: ranking.payout
          },
          { new: true }
        );

        if (!player) {
          throw new AppError(`Player ${ranking.playerId} not found`, 404);
        }

        return {
          playerId: player._id.toString(),
          playerName: player.name,
          position: ranking.position,
          payout: ranking.payout,
          profit: ranking.payout - player.totalBuyIn,
        };
      })
    );

    // Update game status
    game.status = 'completed';
    game.endTime = new Date();
    game.finalRankings = rankings;
    await game.save();

    res.json({
      success: true,
      data: {
        gameId: game._id.toString(),
        status: game.status,
        endTime: game.endTime,
        finalRankings,
        totalPot,
      },
    });
  }
);