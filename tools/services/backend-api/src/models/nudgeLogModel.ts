
import mongoose, { Schema, Document } from 'mongoose';

export interface INudgeLog extends Document {
  user: mongoose.Types.ObjectId;
  nudgeType: string;
  nudgeContent: string;
  actionTaken?: string;
  timestamp: Date;
  feedback?: string;
}

const NudgeLogSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  nudgeType: { type: String, required: true },
  nudgeContent: { type: String, required: true },
  actionTaken: { type: String },
  timestamp: { type: Date, default: Date.now },
  feedback: { type: String },
});

NudgeLogSchema.index({ user: 1 });

const NudgeLog = mongoose.model<INudgeLog>('NudgeLog', NudgeLogSchema);

export default NudgeLog;
