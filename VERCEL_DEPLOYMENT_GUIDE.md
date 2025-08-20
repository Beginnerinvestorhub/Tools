# ▲ Vercel Frontend Deployment Guide

## Step 1: Create Vercel Account & Import Project

1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Click "Add New..." → "Project"
4. Import your `Beginnerinvestorhub/Tools` repository
5. Set **Root Directory**: `frontend`
6. Vercel will auto-detect Next.js framework

## Step 2: Configure Build Settings

Vercel should automatically detect:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## Step 3: Configure Environment Variables

In Vercel dashboard, add these environment variables:

### Production Environment Variables
```bash
# API URLs (replace with your Railway service URLs)
NEXT_PUBLIC_API_BASE_URL=https://your-backend-service.railway.app
NEXT_PUBLIC_PYTHON_ENGINE_URL=https://your-python-engine.railway.app

# Firebase Configuration (your production values)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Stripe Configuration (use live keys for production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key

# Analytics (optional)
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# App Configuration
NEXT_PUBLIC_APP_NAME="Beginner Investor Hub"
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Step 4: Deploy

1. Click "Deploy" in Vercel
2. Vercel will build and deploy your frontend
3. You'll get a URL like: `https://your-app.vercel.app`

## Step 5: Update Backend CORS

After getting your Vercel URL, update your Railway backend service:

1. Go to Railway dashboard
2. Select your backend service
3. Update environment variables:
   ```bash
   FRONTEND_URL=https://your-app.vercel.app
   ALLOWED_ORIGINS=https://your-app.vercel.app
   ```

## Step 6: Custom Domain (Optional)

1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update backend `ALLOWED_ORIGINS` with custom domain

## Important Notes

- All `NEXT_PUBLIC_*` variables are exposed to the browser
- Never put secret keys in frontend environment variables
- Vercel automatically handles HTTPS/SSL certificates
- Environment variables can be set per environment (Production, Preview, Development)

## Testing Your Deployment

After deployment, test:
1. Frontend loads at Vercel URL
2. Authentication works (Firebase)
3. API calls reach Railway backend
4. Payment flow works (Stripe)

## Troubleshooting

- **Build Fails**: Check Vercel build logs
- **API Errors**: Verify Railway URLs in environment variables
- **CORS Errors**: Ensure backend `ALLOWED_ORIGINS` includes Vercel URL
- **Auth Issues**: Verify Firebase configuration
