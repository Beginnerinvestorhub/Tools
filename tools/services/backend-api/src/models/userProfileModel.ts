
import mongoose, { Schema, Document } from 'mongoose';

enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface IUserProfile extends Document {
  user: mongoose.Types.ObjectId;
  phone?: string;
  dateOfBirth?: Date;
  address?: Record<string, any>;
  preferences?: Record<string, any>;
  riskTolerance?: RiskLevel;
  goals?: string;
  investmentGoals?: string;
  timeHorizon?: string;
  learningStyle?: string;
  preferredTopics?: string;
  completedLessons: string[];
  completedChallenges: string[];
  behavioralTendencies?: string;
  updatedAt: Date;
}

const UserProfileSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  phone: { type: String },
  dateOfBirth: { type: Date },
  address: { type: Object },
  preferences: { type: Object },
  riskTolerance: { type: String, enum: Object.values(RiskLevel) },
  goals: { type: String },
  investmentGoals: { type: String },
  timeHorizon: { type: String },
  learningStyle: { type: String },
  preferredTopics: { type: String },
  completedLessons: { type: [String], default: [] },
  completedChallenges: { type: [String], default: [] },
  behavioralTendencies: { type: String },
}, { timestamps: true });

const UserProfile = mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);

export default UserProfile;
