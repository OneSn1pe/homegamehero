import mongoose, { Schema, Document } from 'mongoose';

export interface IGame {
  code: string;
  hostName: string;
  buyIn: number;
  chipValues: {
    white: number;
    red: number;
    green: number;
    black: number;
    blue: number;
  };
  blindStructure: Array<{
    level: number;
    smallBlind: number;
    bigBlind: number;
    duration: number;
  }>;
  players: mongoose.Types.ObjectId[];
  currentBlindLevel: number;
  status: 'waiting' | 'active' | 'completed';
  startTime?: Date;
  endTime?: Date;
  finalRankings?: Array<{
    playerId: string;
    position: number;
    payout: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGameDocument extends IGame, Document {
  _id: mongoose.Types.ObjectId;
}

const blindLevelSchema = new Schema({
  level: {
    type: Number,
    required: true,
    min: 1,
  },
  smallBlind: {
    type: Number,
    required: true,
    min: 0,
  },
  bigBlind: {
    type: Number,
    required: true,
    min: 0,
  },
  duration: {
    type: Number,
    required: true,
    min: 1,
  },
}, { _id: false });

const finalRankingSchema = new Schema({
  playerId: {
    type: String,
    required: true,
  },
  position: {
    type: Number,
    required: true,
    min: 1,
  },
  payout: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const gameSchema = new Schema<IGameDocument>({
  code: {
    type: String,
    required: true,
    unique: true,
    length: 6,
    uppercase: true,
  },
  hostName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  buyIn: {
    type: Number,
    required: true,
    min: 0,
  },
  chipValues: {
    white: {
      type: Number,
      required: true,
      min: 0,
    },
    red: {
      type: Number,
      required: true,
      min: 0,
    },
    green: {
      type: Number,
      required: true,
      min: 0,
    },
    black: {
      type: Number,
      required: true,
      min: 0,
    },
    blue: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  blindStructure: {
    type: [blindLevelSchema],
    required: true,
    validate: {
      validator: function(levels: any[]) {
        return levels.length > 0;
      },
      message: 'At least one blind level is required',
    },
  },
  players: [{
    type: Schema.Types.ObjectId,
    ref: 'Player',
  }],
  currentBlindLevel: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed'],
    default: 'waiting',
    required: true,
  },
  startTime: {
    type: Date,
  },
  endTime: {
    type: Date,
  },
  finalRankings: {
    type: [finalRankingSchema],
  },
}, {
  timestamps: true,
});

// Indexes
gameSchema.index({ status: 1, createdAt: -1 });

// TTL index - automatically delete completed games after 30 days
gameSchema.index(
  { endTime: 1 },
  { 
    expireAfterSeconds: 30 * 24 * 60 * 60,
    partialFilterExpression: { status: 'completed' }
  }
);

const Game = mongoose.model<IGameDocument>('Game', gameSchema);

export default Game;