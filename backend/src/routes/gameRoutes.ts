import { Router } from 'express';
import {
  createGame,
  getGame,
  updateChips,
  addRebuy,
  endGame,
} from '../controllers/gameController';
import { validate } from '../middleware/validation';
import { authenticateLeader } from '../middleware/auth';
import { gameCreationLimiter, apiRateLimiter } from '../middleware/rateLimiter';
import { securityMiddleware, validateObjectId, validateGameCode } from '../middleware/security';
import {
  createGameSchema,
  getGameSchema,
  updateChipsSchema,
  addRebuySchema,
  endGameSchema,
} from '../validation/gameSchemas';

const router = Router();

// Apply security middleware to all routes
router.use(securityMiddleware);
router.use(apiRateLimiter);

// Create a new game
router.post(
  '/',
  gameCreationLimiter,
  validate(createGameSchema),
  createGame
);

// Get game by code (public access allowed)
router.get(
  '/:code',
  validateGameCode,
  validate(getGameSchema),
  getGame
);

// Update player's chips (requires leader authentication)
router.put(
  '/:id/chips',
  validateObjectId('id'),
  authenticateLeader,
  validate(updateChipsSchema),
  updateChips
);

// Add rebuy for a player (requires leader authentication)
router.post(
  '/:id/rebuy',
  validateObjectId('id'),
  authenticateLeader,
  validate(addRebuySchema),
  addRebuy
);

// End game and calculate payouts (requires leader authentication)
router.post(
  '/:id/end',
  validateObjectId('id'),
  authenticateLeader,
  validate(endGameSchema),
  endGame
);

export default router;