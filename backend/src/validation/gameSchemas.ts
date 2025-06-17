import Joi from 'joi';

export const createGameSchema = Joi.object({
  hostName: Joi.string().trim().min(1).max(50).required(),
  buyIn: Joi.number().positive().required(),
  chipValues: Joi.object({
    white: Joi.number().positive().required(),
    red: Joi.number().positive().required(),
    green: Joi.number().positive().required(),
    black: Joi.number().positive().required(),
    blue: Joi.number().positive().required(),
  }).required(),
  blindStructure: Joi.array()
    .items(
      Joi.object({
        level: Joi.number().integer().positive().required(),
        smallBlind: Joi.number().positive().required(),
        bigBlind: Joi.number().positive().required(),
        duration: Joi.number().integer().positive().required(),
      })
    )
    .min(1)
    .required(),
});

export const getGameSchema = Joi.object({
  code: Joi.string()
    .length(6)
    .uppercase()
    .pattern(/^[A-Z0-9]+$/)
    .required(),
});

export const updateChipsSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
  playerId: Joi.string().hex().length(24).required(),
  chips: Joi.number().integer().min(0).required(),
});

export const addRebuySchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
  playerId: Joi.string().hex().length(24).required(),
  amount: Joi.number().positive().required(),
});

export const endGameSchema = Joi.object({
  id: Joi.string().hex().length(24).required(),
  rankings: Joi.array()
    .items(
      Joi.object({
        playerId: Joi.string().hex().length(24).required(),
        position: Joi.number().integer().positive().required(),
        payout: Joi.number().min(0).required(),
      })
    )
    .min(1)
    .required(),
});