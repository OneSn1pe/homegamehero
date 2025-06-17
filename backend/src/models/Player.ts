import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayer {
  gameId: mongoose.Types.ObjectId;
  name: string;
  currentChips: number;
  totalBuyIn: number;
  rebuys: number;
  status: 'active' | 'eliminated' | 'away';
  finalPosition?: number;
  payout?: number;
  joinedAt: Date;
  updatedAt: Date;
}

export interface IPlayerDocument extends IPlayer, Document {
  _id: mongoose.Types.ObjectId;
}

const playerSchema = new Schema<IPlayerDocument>(
  {
    gameId: {
      type: Schema.Types.ObjectId,
      ref: 'Game',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    currentChips: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalBuyIn: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    rebuys: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'eliminated', 'away'],
      default: 'active',
    },
    finalPosition: {
      type: Number,
      min: 1,
    },
    payout: {
      type: Number,
      min: 0,
      default: 0,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for game-player lookups
playerSchema.index({ gameId: 1, name: 1 }, { unique: true });

export const Player = mongoose.model<IPlayerDocument>('Player', playerSchema);