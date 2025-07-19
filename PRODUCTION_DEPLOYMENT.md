# Production Deployment Guide

## Required Environment Variables

### Frontend (.env.local or deployment platform)
```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://your-backend-domain.com
NEXT_PUBLIC_PYTHON_ENGINE_URL=https://your-python-engine-domain.com

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Third-party APIs
NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
NEXT_PUBLIC_IEX_CLOUD_API_KEY=your_iex_cloud_key
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=your_ga_id

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# Optional: Override specific service URLs
PORTFOLIO_API_URL=https://your-backend-domain.com/api/portfolio
ESG_API_URL=https://your-backend-domain.com/api/esg
RISK_ENGINE_URL=https://your-python-engine-domain.com/assess-risk
```

### Backend (.env or deployment platform)
```bash
# Server Configuration
NODE_ENV=production
PORT=4000
BACKEND_HOST=your-backend-domain.com

# Frontend URL (for CORS and redirects)
FRONTEND_URL=https://your-frontend-domain.com
ALLOWED_ORIGINS=https://your-frontend-domain.com

# Authentication
JWT_SECRET=your_super_secure_jwt_secret_key_here

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"

# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key

# Monitoring
SENTRY_DSN=your_backend_sentry_dsn
```

### Python Engine (.env or deployment platform)
```bash
# Database
DATABASE_URL=postgresql://user:password@your-db-host:5432/risk_db
ASYNC_DATABASE_URL=postgresql+asyncpg://user:password@your-db-host:5432/risk_db

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Celery
CELERY_BROKER_URL=redis://your-redis-host:6379/1
CELERY_RESULT_BACKEND=redis://your-redis-host:6379/2

# CORS
CORS_ORIGINS=https://your-frontend-domain.com

# API Keys
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
```

## Deployment Steps

### 1. Deploy Backend Services
1. Deploy your Node.js backend to a cloud provider (Heroku, Railway, Render, etc.)
2. Deploy your Python engine to a cloud provider
3. Set up production database (PostgreSQL) and Redis
4. Configure all environment variables in your deployment platform

### 2. Update Frontend Configuration
1. Update `NEXT_PUBLIC_API_BASE_URL` to your deployed backend URL
2. Update `NEXT_PUBLIC_PYTHON_ENGINE_URL` to your deployed Python engine URL
3. Set all other production environment variables

### 3. Deploy Frontend
1. Deploy to Vercel, Netlify, or similar platform
2. Configure environment variables in deployment platform
3. Ensure build completes successfully

### 4. Test Production Environment
1. Test authentication flow
2. Verify API calls work with production endpoints
3. Test payment processing with Stripe
4. Verify all features work end-to-end

## Security Checklist
- [ ] All API keys are set as environment variables
- [ ] JWT_SECRET is a strong, unique key
- [ ] Firebase private key is properly formatted
- [ ] CORS is configured for production domains only
- [ ] Stripe is using live keys (not test keys)
- [ ] Database connections use SSL in production

## Common Issues
1. **CORS Errors**: Ensure `ALLOWED_ORIGINS` includes your frontend domain
2. **API 404 Errors**: Verify backend is deployed and `NEXT_PUBLIC_API_BASE_URL` is correct
3. **Firebase Auth Issues**: Check all Firebase config variables are set correctly
4. **Stripe Errors**: Ensure you're using live keys for production

## Environment Variable Priority
The updated API proxies now follow this priority:
1. Specific service URL (e.g., `PORTFOLIO_API_URL`)
2. Base API URL + endpoint (e.g., `NEXT_PUBLIC_API_BASE_URL/api/portfolio`)
3. Localhost fallback (development only)
