
import mongoose, { Schema, Document } from 'mongoose';

enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
  DIVIDEND = 'DIVIDEND',
}

export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId;
  type: TransactionType;
  symbol: string;
  quantity: number;
  price: number;
  total: number;
  date: Date;
  portfolio: mongoose.Types.ObjectId;
}

const TransactionSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: Object.values(TransactionType), required: true },
  symbol: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  portfolio: { type: Schema.Types.ObjectId, ref: 'Portfolio' },
});

TransactionSchema.index({ user: 1 });
TransactionSchema.index({ portfolio: 1 });

const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);

export default Transaction;
