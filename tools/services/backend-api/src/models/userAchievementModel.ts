
import mongoose, { Schema, Document } from 'mongoose';

export interface IUserAchievement extends Document {
  user: mongoose.Types.ObjectId;
  achievement: mongoose.Types.ObjectId;
  earnedAt?: Date;
  progress: number;
  updatedAt: Date;
}

const UserAchievementSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  achievement: { type: Schema.Types.ObjectId, ref: 'Achievement', required: true },
  earnedAt: { type: Date },
  progress: { type: Number, default: 0 },
}, { timestamps: true });

UserAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });

const UserAchievement = mongoose.model<IUserAchievement>('UserAchievement', UserAchievementSchema);

export default UserAchievement;
