import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// 1. Interface for User Document
export interface IUser extends Document {
  username: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  riskProfile?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  educationProgress?: {
    module: string;
    completed: boolean;
    score?: number;
  }[];
  lastQuestionnaire?: Record<string, any>;
}

// 2. Define the User Schema
const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+@.+\..+/, 'Please enter a valid email address'], // Basic email regex
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false, // Don't return password by default in queries
  },
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  riskProfile: {
    type: Schema.Types.ObjectId,
    ref: 'RiskProfile', // Reference to the RiskProfile model
    default: null,
  },
  educationProgress: {
    type: [
      {
        module: { type: String, required: true },
        completed: { type: Boolean, default: false },
        score: { type: Number }
      }
    ],
    default: []
  },
  lastQuestionnaire: {
    type: Object,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true
});

// 3. Pre-save hook to hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password!, salt);
  next();
});

// 4. Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  // 'this.password' needs to be explicitly selected in the query for this to work
  // e.g., User.findOne({ email }).select('+password')
  return bcrypt.compare(candidatePassword, this.password || '');
};

// 5. Create and Export the Model
const User = mongoose.model<IUser>('User', UserSchema);

export default User;

