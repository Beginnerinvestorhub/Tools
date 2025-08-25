
import mongoose, { Schema, Document } from 'mongoose';

export interface ILearningPath extends Document {
  user: mongoose.Types.ObjectId;
  currentLessonId?: string;
  completedLessons: string[];
  completedChallenges: string[];
  nextRecommended?: string;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

const LearningPathSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currentLessonId: { type: String },
  completedLessons: { type: [String], default: [] },
  completedChallenges: { type: [String], default: [] },
  nextRecommended: { type: String },
  progress: { type: Number, default: 0 },
}, { timestamps: true });

LearningPathSchema.index({ user: 1 });

const LearningPath = mongoose.model<ILearningPath>('LearningPath', LearningPathSchema);

export default LearningPath;
