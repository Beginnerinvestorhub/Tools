import mongoose, { Schema, Document } from 'mongoose';

// 1. Interface for MarketData Document
export interface IMarketData extends Document {
  symbol: string; // e.g., 'AAPL', 'SPY', 'TLT'
  type: 'Stock' | 'ETF' | 'Index' | 'Bond' | 'Commodity';
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  // Add other relevant data points like adjusted close, dividends, etc.
  adjustedClose?: number;
  dividends?: number;
  splitCoefficient?: number;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Define the MarketData Schema
const MarketDataSchema: Schema = new Schema({
  symbol: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['Stock', 'ETF', 'Index', 'Bond', 'Commodity'],
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  open: {
    type: Number,
    required: true,
    min: 0,
  },
  high: {
    type: Number,
    required: true,
    min: 0,
  },
  low: {
    type: Number,
    required: true,
    min: 0,
  },
  close: {
    type: Number,
    required: true,
    min: 0,
  },
  volume: {
    type: Number,
    required: true,
    min: 0,
  },
  adjustedClose: {
    type: Number,
    min: 0,
  },
  dividends: {
    type: Number,
    min: 0,
    default: 0,
  },
  splitCoefficient: {
    type: Number,
    min: 0,
    default: 1,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Add an index for faster queries on symbol and date
MarketDataSchema.index({ symbol: 1, date: 1 }, { unique: true });

// 3. Create and Export the Model
const MarketData = mongoose.model<IMarketData>('MarketData', MarketDataSchema);

export default MarketData;

