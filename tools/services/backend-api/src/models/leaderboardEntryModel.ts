
import mongoose, { Schema, Document } from 'mongoose';

export interface ILeaderboardEntry extends Document {
  user: mongoose.Types.ObjectId;
  points: number;
  rank?: number;
  lastUpdated: Date;
}

const LeaderboardEntrySchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  points: { type: Number, default: 0 },
  rank: { type: Number },
}, { timestamps: { updatedAt: 'lastUpdated' } });

const LeaderboardEntry = mongoose.model<ILeaderboardEntry>('LeaderboardEntry', LeaderboardEntrySchema);

export default LeaderboardEntry;
