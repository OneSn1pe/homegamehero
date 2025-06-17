import { Router } from 'express';
import {
  createGame,
  getGame,
  updateChips,
  addRebuy,
  endGame,
} from '../controllers/gameController';
import { validate } from '../middleware/validation';
import {
  createGameSchema,
  getGameSchema,
  updateChipsSchema,
  addRebuySchema,
  endGameSchema,
} from '../validation/gameSchemas';

const router = Router();

// Create a new game
router.post(
  '/',
  validate(createGameSchema),
  createGame
);

// Get game by code
router.get(
  '/:code',
  validate(getGameSchema),
  getGame
);

// Update player's chips
router.put(
  '/:id/chips',
  validate(updateChipsSchema),
  updateChips
);

// Add rebuy for a player
router.post(
  '/:id/rebuy',
  validate(addRebuySchema),
  addRebuy
);

// End game and calculate payouts
router.post(
  '/:id/end',
  validate(endGameSchema),
  endGame
);

export default router;