
import mongoose, { Schema, Document } from 'mongoose';

export interface IUserChallenge extends Document {
  user: mongoose.Types.ObjectId;
  challenge: mongoose.Types.ObjectId;
  completed: boolean;
  progress: number;
  updatedAt: Date;
}

const UserChallengeSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  challenge: { type: Schema.Types.ObjectId, ref: 'Challenge', required: true },
  completed: { type: Boolean, default: false },
  progress: { type: Number, default: 0 },
  updatedAt: { type: Date, default: Date.now },
});

UserChallengeSchema.index({ user: 1, challenge: 1 }, { unique: true });

const UserChallenge = mongoose.model<IUserChallenge>('UserChallenge', UserChallengeSchema);

export default UserChallenge;
