import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ⚠️ Warn if Stripe key is missing (but don't crash)
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('⚠️ STRIPE_SECRET_KEY not found - Stripe functionality will be disabled');
}

const app = express();

// Middleware: Dev logger
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Middleware: CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : '*';

app.use(cors({ origin: allowedOrigins }));

// Middleware: Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all API routes
app.use('/api/', limiter);

app.use(express.json());

// API Routes
import { authRouter } from './routes/auth';
import { userRouter } from './routes/user';
import { dashboardRouter } from './routes/dashboard';
import { adminRouter } from './routes/admin';
import newsletterRouter from './routes/newsletter';
import stripeRouter from './routes/stripe';
import profileRouter from './routes/profile';

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/admin', adminRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/profile', profileRouter);

// Health Check
app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

// Start Server
if (require.main === module) {
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    const host = process.env.NODE_ENV === 'production' ? process.env.BACKEND_HOST || 'production' : 'localhost';
    console.log(`✅ Backend API running at http://${host}:${port}`);
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log('🔧 Loaded ENV:', {
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
    });
  }
}

export default app;