import mongoose, { Schema, Document } from 'mongoose';
import { IGame, IChipColor, IRebuy, IPlayer } from '../types/models';

// Extend IGame with Mongoose Document properties
export interface IGameDocument extends IGame, Document {
  _id: string;
}

// Sub-schemas
const ChipColorSchema = new Schema<IChipColor>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const RebuySchema = new Schema<IRebuy>({
  playerName: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  chipsByColor: {
    type: Map,
    of: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const PlayerSchema = new Schema<IPlayer>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  initialChips: {
    type: Map,
    of: Number,
    required: true
  },
  currentChips: {
    type: Map,
    of: Number,
    required: true
  },
  totalBuyIn: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

// Main Game schema
const GameSchema = new Schema<IGameDocument>({
  groupCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
    minlength: 6,
    maxlength: 6,
    uppercase: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['setup', 'active', 'completed'],
    default: 'setup',
    required: true
  },
  leaderId: {
    type: String,
    required: true
  },
  chipConfig: {
    colors: {
      type: [ChipColorSchema],
      required: true,
      validate: {
        validator: function(colors: IChipColor[]) {
          return colors.length > 0;
        },
        message: 'At least one chip color must be configured'
      }
    }
  },
  financials: {
    initialBuyIn: {
      type: Number,
      required: true,
      min: 0
    },
    totalPot: {
      type: Number,
      required: true,
      min: 0
    },
    rebuys: {
      type: [RebuySchema],
      default: []
    }
  },
  players: {
    type: [PlayerSchema],
    required: true,
    validate: {
      validator: function(players: IPlayer[]) {
        return players.length >= 2;
      },
      message: 'A game must have at least 2 players'
    }
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
GameSchema.index({ createdAt: 1 });
GameSchema.index({ status: 1 });

// TTL index - automatically delete games after 30 days of completion
GameSchema.index(
  { createdAt: 1 },
  { 
    expireAfterSeconds: 30 * 24 * 60 * 60, // 30 days
    partialFilterExpression: { status: 'completed' }
  }
);

// Virtual for game age
GameSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Methods
GameSchema.methods.isExpired = function(): boolean {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.status === 'completed' && this.createdAt < thirtyDaysAgo;
};

// Statics
GameSchema.statics.findByGroupCode = function(groupCode: string) {
  return this.findOne({ groupCode: groupCode.toUpperCase() });
};

const Game = mongoose.model<IGameDocument>('Game', GameSchema);

export default Game;