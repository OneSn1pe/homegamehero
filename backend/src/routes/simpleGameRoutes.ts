import { Router } from 'express';
import { Request, Response } from 'express';
import Game from '../models/simpleGame';
import { authenticateLeader } from '../middleware/auth';
import { generateLeaderToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { socketService } from '../index';

const router = Router();

// Generate unique game code
const generateGameCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Create game
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  const { name, buyIn, chipValues } = req.body;
  
  let code: string;
  let exists = true;
  
  while (exists) {
    code = generateGameCode();
    const existing = await Game.findOne({ code });
    exists = !!existing;
  }
  
  const game = await Game.create({
    code: code!,
    name,
    buyIn,
    chipValues,
    players: [],
    rebuys: [],
    status: 'active'
  });
  
  const leaderToken = generateLeaderToken(game._id.toString());
  
  socketService.emitGameUpdate(code!, 'game_created', { game });
  
  res.json({
    game: game.toObject(),
    leaderToken
  });
}));

// Get game by code
router.get('/:code', asyncHandler(async (req: Request, res: Response) => {
  const game = await Game.findOne({ code: req.params.code });
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  res.json(game);
}));

// Join game
router.post('/:code/join', asyncHandler(async (req: Request, res: Response) => {
  const { playerName } = req.body;
  const { code } = req.params;
  
  const game = await Game.findOne({ code });
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  if (game.players.some(p => p.name === playerName)) {
    return res.status(400).json({ error: 'Player name already taken' });
  }
  
  game.players.push({
    name: playerName,
    buyIn: game.buyIn,
    rebuys: 0
  });
  
  await game.save();
  
  socketService.emitGameUpdate(code, 'player_joined', { 
    playerName,
    game: game.toObject()
  });
  
  res.json(game);
}));

// Update chips (cash out)
router.put('/:id/chips', authenticateLeader, asyncHandler(async (req: Request, res: Response) => {
  const { playerId, cashOut } = req.body;
  
  const game = await Game.findById(req.params.id);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  const player = game.players.id(playerId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  player.cashOut = cashOut;
  await game.save();
  
  socketService.emitGameUpdate(game.code, 'chips_updated', {
    playerId,
    cashOut,
    game: game.toObject()
  });
  
  res.json(game);
}));

// Add rebuy
router.post('/:id/rebuy', authenticateLeader, asyncHandler(async (req: Request, res: Response) => {
  const { playerId, amount } = req.body;
  
  const game = await Game.findById(req.params.id);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  const player = game.players.id(playerId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }
  
  player.rebuys += 1;
  game.rebuys.push({
    playerId,
    amount: amount || game.buyIn,
    timestamp: new Date()
  });
  
  await game.save();
  
  socketService.emitGameUpdate(game.code, 'rebuy_added', {
    playerId,
    amount,
    game: game.toObject()
  });
  
  res.json(game);
}));

// End game
router.post('/:id/end', authenticateLeader, asyncHandler(async (req: Request, res: Response) => {
  const game = await Game.findById(req.params.id);
  
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  
  // Calculate payouts
  const { calculatePayouts } = await import('../services/calculationService');
  const playerData = game.players.map(p => ({
    name: p.name,
    buyIn: p.buyIn + (p.rebuys * game.buyIn),
    cashOut: p.cashOut || 0
  }));
  
  const payouts = calculatePayouts(playerData);
  
  game.status = 'ended';
  game.payouts = payouts;
  game.totalPot = playerData.reduce((sum, p) => sum + p.buyIn, 0);
  
  await game.save();
  
  socketService.emitGameUpdate(game.code, 'game_ended', {
    game: game.toObject()
  });
  
  res.json(game);
}));

export default router;