
import mongoose, { Schema, Document } from 'mongoose';

export interface IPortfolio extends Document {
  name: string;
  user: mongoose.Types.ObjectId;
  holdings: Record<string, any>; // JSON field
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioSchema: Schema = new Schema({
  name: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  holdings: { type: Object, required: true },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

PortfolioSchema.index({ user: 1 });

const Portfolio = mongoose.model<IPortfolio>('Portfolio', PortfolioSchema);

export default Portfolio;
