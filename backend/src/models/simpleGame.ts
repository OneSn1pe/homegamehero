import mongoose, { Schema, Document } from 'mongoose';

export interface IChipValue {
  value: number;
  color: string;
  quantity: number;
}

export interface IPlayer {
  _id?: string;
  name: string;
  buyIn: number;
  cashOut?: number;
  rebuys: number;
}

export interface IRebuy {
  playerId: string;
  amount: number;
  timestamp: Date;
}

export interface IPayout {
  from: string;
  to: string;
  amount: number;
}

export interface IGame extends Document {
  code: string;
  name: string;
  buyIn: number;
  chipValues: IChipValue[];
  players: IPlayer[];
  rebuys: IRebuy[];
  status: 'active' | 'ended';
  payouts?: IPayout[];
  totalPot?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ChipValueSchema = new Schema({
  value: { type: Number, required: true },
  color: { type: String, required: true },
  quantity: { type: Number, required: true }
});

const PlayerSchema = new Schema({
  name: { type: String, required: true },
  buyIn: { type: Number, required: true },
  cashOut: { type: Number },
  rebuys: { type: Number, default: 0 }
});

const RebuySchema = new Schema({
  playerId: { type: String, required: true },
  amount: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

const PayoutSchema = new Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  amount: { type: Number, required: true }
});

const GameSchema = new Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    match: /^[A-Z0-9]{6}$/
  },
  name: { type: String, required: true },
  buyIn: { type: Number, required: true, min: 1 },
  chipValues: [ChipValueSchema],
  players: [PlayerSchema],
  rebuys: [RebuySchema],
  status: { 
    type: String, 
    enum: ['active', 'ended'],
    default: 'active' 
  },
  payouts: [PayoutSchema],
  totalPot: { type: Number }
}, {
  timestamps: true
});

// Index for faster code lookups
GameSchema.index({ code: 1 });

export default mongoose.model<IGame>('SimpleGame', GameSchema);