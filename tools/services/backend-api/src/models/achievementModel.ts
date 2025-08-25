
import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
  name: string;
  description: string;
  criteria: Record<string, any>; // JSON field
  icon?: string;
  points: number;
  createdAt: Date;
}

const AchievementSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  criteria: { type: Object, required: true },
  icon: { type: String },
  points: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Achievement = mongoose.model<IAchievement>('Achievement', AchievementSchema);

export default Achievement;
