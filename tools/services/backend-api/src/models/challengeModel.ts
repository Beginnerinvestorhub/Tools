
import mongoose, { Schema, Document } from 'mongoose';

export interface IChallenge extends Document {
  title: string;
  description: string;
  type: string;
  target: number;
  reward: Record<string, any>;
  createdAt: Date;
}

const ChallengeSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  target: { type: Number, required: true },
  reward: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Challenge = mongoose.model<IChallenge>('Challenge', ChallengeSchema);

export default Challenge;
