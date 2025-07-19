# 🚨 Railway Deployment Fix

## The Problem
Railway is trying to build from the root directory which uses `pnpm` and monorepo structure, but Railway doesn't have `pnpm` installed by default.

## ✅ Solution: Configure Railway Services Individually

### Step 1: Delete Current Railway Project
1. Go to your Railway dashboard
2. Delete the current project that's failing to build

### Step 2: Create New Railway Project for Backend

1. **Create New Project** in Railway
2. **Connect GitHub Repository**: `https://github.com/Beginnerinvestorhub/Tools.git`
3. **IMPORTANT**: In the service settings, configure:
   - **Root Directory**: `/backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### Step 3: Add Environment Variables to Backend Service

```
NODE_ENV=production
PORT=4000
JWT_SECRET=your_super_secure_jwt_secret_make_it_long_and_random_123456789
```

### Step 4: Create Second Service for Python Engine

1. **Add New Service** to the same Railway project
2. **Connect Same Repository**: `https://github.com/Beginnerinvestorhub/Tools.git`
3. **Configure Service Settings**:
   - **Root Directory**: `/python-engine`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Step 5: Add Databases

1. **Add PostgreSQL** service to the project
2. **Add Redis** service to the project

### Step 6: Configure Database Environment Variables

**For Backend Service**, add:
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

**For Python Engine**, add:
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

## 🎯 Key Railway Configuration Tips

### Backend Service Configuration:
- **Framework**: Node.js
- **Root Directory**: `/backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Port**: Railway auto-detects from `process.env.PORT`

### Python Engine Configuration:
- **Framework**: Python
- **Root Directory**: `/python-engine`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Port**: Railway auto-detects from `$PORT`

## 🔧 Alternative: Use Railway CLI (Advanced)

If the web interface doesn't work, you can use Railway CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Create new project
railway new

# Deploy backend
cd backend
railway up

# Deploy python engine (in new terminal)
cd python-engine
railway up
```

## 📋 Expected Results

After successful deployment, you should have:
- **Backend API**: `https://backend-production-xxxx.up.railway.app`
- **Python Engine**: `https://python-engine-production-xxxx.up.railway.app`
- **PostgreSQL**: Managed database with connection URL
- **Redis**: Managed cache with connection URL

## 🚨 Common Issues & Solutions

### Issue: "pnpm not found"
**Solution**: Make sure you set the **Root Directory** to `/backend` or `/python-engine`, not the root of the repo.

### Issue: "npm run build fails"
**Solution**: Check that the Root Directory is set correctly and the service can find `package.json`.

### Issue: "Port binding error"
**Solution**: Ensure your app listens on `process.env.PORT` (Node.js) or `$PORT` (Python).

## ✅ Next Steps After Successful Deployment

1. Note down the Railway URLs for both services
2. Deploy frontend to Vercel with these URLs
3. Configure CORS settings
4. Test end-to-end functionality

The key is to deploy each service individually with its own root directory, not from the monorepo root!
