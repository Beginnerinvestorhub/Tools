# Railway Deployment Guide

## 🚀 Step-by-Step Deployment Process

### Phase 1: Prepare Your Repository

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

### Phase 2: Set Up Railway Account

1. Go to [railway.app](https://railway.app)
2. Sign up with your GitHub account
3. Connect your GitHub repository

### Phase 3: Deploy Backend Services

#### A. Deploy Node.js Backend

1. **Create New Project** in Railway
2. **Connect GitHub Repository**
3. **Select Backend Service**:
   - Root directory: `/backend`
   - Build command: `npm run build`
   - Start command: `npm start`

4. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PORT=4000
   JWT_SECRET=your_super_secure_jwt_secret_here
   STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour key here\n-----END PRIVATE KEY-----\n"
   ```

#### B. Deploy Python Risk Engine

1. **Add New Service** to same Railway project
2. **Connect Same Repository**
3. **Select Python Engine**:
   - Root directory: `/tools` or `/python-engine`
   - Build command: `pip install -r requirements.txt`
   - Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Add Environment Variables**:
   ```
   ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
   CORS_ORIGINS=https://your-frontend-domain.com
   ```

### Phase 4: Set Up Databases

#### A. Add PostgreSQL Database

1. **Add PostgreSQL** service to Railway project
2. Railway will automatically provide:
   - `DATABASE_URL`
   - `POSTGRES_HOST`
   - `POSTGRES_PORT`
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DB`

#### B. Add Redis Database

1. **Add Redis** service to Railway project
2. Railway will automatically provide:
   - `REDIS_URL`
   - `REDIS_HOST`
   - `REDIS_PORT`

### Phase 5: Configure Service Communication

1. **Get Service URLs** from Railway dashboard:
   - Node.js Backend: `https://your-backend.railway.app`
   - Python Engine: `https://your-python-engine.railway.app`

2. **Update Backend Environment Variables**:
   ```
   FRONTEND_URL=https://your-frontend-domain.com
   ALLOWED_ORIGINS=https://your-frontend-domain.com
   PYTHON_ENGINE_URL=https://your-python-engine.railway.app
   ```

3. **Update Python Engine Environment Variables**:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   ```

### Phase 6: Deploy Frontend

#### Option A: Deploy to Vercel (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. **Set Environment Variables**:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-backend.railway.app
   NEXT_PUBLIC_PYTHON_ENGINE_URL=https://your-python-engine.railway.app
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
   ```

#### Option B: Deploy to Railway

1. **Add Frontend Service** to Railway project
2. **Set Build Settings**:
   - Root directory: `/frontend`
   - Build command: `npm run build`
   - Start command: `npm start`

### Phase 7: Update CORS Configuration

Once you have your frontend URL, update backend CORS:

```bash
# In Railway backend environment variables
ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### Phase 8: Test Deployment

1. **Test Backend Health**:
   - Visit: `https://your-backend.railway.app/api/health`
   - Should return: `{"status": "ok"}`

2. **Test Python Engine**:
   - Visit: `https://your-python-engine.railway.app/docs`
   - Should show FastAPI documentation

3. **Test Frontend**:
   - Visit your frontend URL
   - Test login/signup flow
   - Test API integrations

## 🔧 Troubleshooting Common Issues

### Backend Won't Start
- Check environment variables are set correctly
- Verify `PORT` is set to Railway's `$PORT`
- Check logs in Railway dashboard

### Database Connection Issues
- Ensure `DATABASE_URL` is properly formatted
- Check if database service is running
- Verify connection string includes SSL parameters

### CORS Errors
- Update `ALLOWED_ORIGINS` with exact frontend URL
- Include both `http://` and `https://` if needed
- Check for trailing slashes in URLs

### Python Engine Issues
- Verify `requirements.txt` includes all dependencies
- Check Python version compatibility
- Ensure `uvicorn` is in requirements

## 💡 Pro Tips

1. **Use Railway's Variable References**:
   ```
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   REDIS_URL=${{Redis.REDIS_URL}}
   ```

2. **Monitor Logs**: Use Railway dashboard to monitor deployment logs

3. **Staging Environment**: Create a separate Railway project for staging

4. **Custom Domains**: Railway supports custom domains in paid plans

## 📋 Deployment Checklist

- [ ] Repository pushed to GitHub
- [ ] Railway account created and connected
- [ ] Node.js backend deployed with environment variables
- [ ] Python engine deployed with environment variables
- [ ] PostgreSQL database added and connected
- [ ] Redis database added and connected
- [ ] Frontend deployed with production environment variables
- [ ] CORS configured for frontend domain
- [ ] Health endpoints tested
- [ ] Full authentication flow tested
- [ ] API integrations verified working

## 🚨 Security Notes

- Never commit `.env` files to Git
- Use Railway's environment variable management
- Rotate JWT secrets regularly
- Use strong database passwords
- Enable SSL for all connections
