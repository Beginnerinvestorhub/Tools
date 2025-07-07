import mongoose, { Schema, Document } from 'mongoose';

// 1. Interface for Simulation Document
export interface ISimulation extends Document {
  user: mongoose.Types.ObjectId; // Reference to the User
  simulationDate: Date;
  initialInvestment: number;
  // This could be a complex object representing the simulated portfolio allocation
  portfolioAllocation: {
    stocks: number;
    bonds: number;
    realEstate: number;
    commodities: number;
    // Add more asset classes as needed
  };
  // Results of the simulation
  simulatedReturns: {
    year: number;
    value: number;
  }[]; // Array of year-value pairs
  volatility: number;
  maxDrawdown: number;
  scenario: string; // e.g., 'Bullish', 'Bearish', 'Normal'
  notes?: string; // Optional notes about the simulation
  createdAt: Date;
  updatedAt: Date;
}

// 2. Define the Simulation Schema
const SimulationSchema: Schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  simulationDate: {
    type: Date,
    default: Date.now,
  },
  initialInvestment: {
    type: Number,
    required: true,
    min: 0,
  },
  portfolioAllocation: {
    stocks: { type: Number, required: true, min: 0, max: 100 },
    bonds: { type: Number, required: true, min: 0, max: 100 },
    realEstate: { type: Number, required: true, min: 0, max: 100 },
    commodities: { type: Number, required: true, min: 0, max: 100 },
    // Ensure the sum of percentages is handled in application logic or custom validation
  },
  simulatedReturns: [
    {
      year: { type: Number, required: true },
      value: { type: Number, required: true },
    },
  ],
  volatility: {
    type: Number,
    required: true,
    min: 0,
  },
  maxDrawdown: {
    type: Number,
    required: true,
  },
  scenario: {
    type: String,
    required: true,
    // Add more specific enums if you have predefined scenarios
  },
  notes: {
    type: String,
    trim: true,
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

// 3. Create and Export the Model
const Simulation = mongoose.model<ISimulation>('Simulation', SimulationSchema);

export default Simulation;

