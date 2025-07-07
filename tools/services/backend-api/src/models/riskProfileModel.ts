import mongoose, { Schema, Document } from 'mongoose';

// 1. Interface for RiskProfile Document
export interface IRiskProfile extends Document {
  user: mongoose.Types.ObjectId; // Reference to the User who owns this profile
  riskScore: number;
  riskLevel: 'Conservative' | 'Moderate' | 'Aggressive';
  investmentHorizon: 'Short-term' | 'Mid-term' | 'Long-term';
  liquidityNeeds: 'Low' | 'Medium' | 'High';
  // You can add more fields based on your risk assessment questionnaire
  // e.g., financialGoals: string; currentInvestments: string;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Define the RiskProfile Schema
const RiskProfileSchema: Schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
    unique: true, // Each user should have only one risk profile
  },
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100, // Assuming a score between 0 and 100
  },
  riskLevel: {
    type: String,
    enum: ['Conservative', 'Moderate', 'Aggressive'],
    required: true,
  },
  investmentHorizon: {
    type: String,
    enum: ['Short-term', 'Mid-term', 'Long-term'],
    required: true,
  },
  liquidityNeeds: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: true,
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
const RiskProfile = mongoose.model<IRiskProfile>('RiskProfile', RiskProfileSchema);

export default RiskProfile;

