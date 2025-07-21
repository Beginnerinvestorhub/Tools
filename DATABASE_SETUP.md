# PostgreSQL Database Setup Guide

## 🗄️ **Database Integration for Gamification System**

This guide covers setting up PostgreSQL on Render for the gamification system.

---

## **Step 1: Create PostgreSQL Database on Render**

### **1.1 Create Database Service**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Configure database:
   - **Name**: `beginnerinvestorhub-db`
   - **Database**: `gamification_db`
   - **User**: `gamification_user`
   - **Region**: Same as your backend (US East)
   - **PostgreSQL Version**: 15 (latest)
   - **Plan**: Free tier (sufficient for development)

### **1.2 Get Connection Details**
After creation, note these connection details:
- **Internal Database URL**: `postgresql://user:pass@host:port/db`
- **External Database URL**: `postgresql://user:pass@external-host:port/db`
- **Host**: Internal hostname for backend connection
- **Port**: Usually 5432
- **Database Name**: `gamification_db`
- **Username**: Auto-generated
- **Password**: Auto-generated

---

## **Step 2: Configure Backend Environment Variables**

### **2.1 Add to Render Backend Service**
1. Go to your backend service on Render
2. Navigate to **Environment** tab
3. Add environment variable:
   - **Key**: `DATABASE_URL`
   - **Value**: The **Internal Database URL** from Step 1.2

### **2.2 Local Development (.env)**
Create/update `backend/.env`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/gamification_local
NODE_ENV=development
```

---

## **Step 3: Database Schema Initialization**

The backend will automatically initialize the database schema on startup using:
- `backend/database/schema/gamification.sql` - Creates all tables
- `backend/database/seeds/gamification_data.sql` - Inserts badge and achievement definitions

### **3.1 Manual Schema Setup (if needed)**
If automatic initialization fails, connect to your database and run:

```sql
-- Connect to your database using psql or a GUI tool
-- Run the schema file
\i /path/to/backend/database/schema/gamification.sql

-- Run the seed data
\i /path/to/backend/database/seeds/gamification_data.sql
```

---

## **Step 4: Verify Database Connection**

### **4.1 Check Backend Logs**
After deploying with `DATABASE_URL`, check backend logs for:
```
✅ Database connection successful
🗄️ Database initialized successfully
✅ Backend API running at http://production:4000
```

### **4.2 Test API Endpoints**
Test gamification endpoints:
```bash
# Get user progress (requires authentication)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://your-backend.onrender.com/api/gamification/progress

# Health check
curl https://your-backend.onrender.com/api/health
```

---

## **Step 5: Database Tables Overview**

### **Core Tables**
- `user_progress` - User points, level, streaks
- `badges` - Master list of all badges
- `user_badges` - Badges unlocked by users
- `achievements` - Master list of achievements
- `user_achievements` - User achievement progress
- `user_stats` - Detailed user statistics
- `gamification_events` - Audit log of all events

### **Future Tables (Advanced Features)**
- `leaderboard_entries` - Leaderboard rankings
- `challenges` - Weekly/monthly challenges
- `user_challenges` - User challenge participation

---

## **Step 6: Monitoring & Maintenance**

### **6.1 Database Monitoring**
- Monitor connection pool usage
- Check query performance
- Monitor storage usage (free tier has limits)

### **6.2 Backup Strategy**
- Render provides automatic backups for paid plans
- For free tier, consider periodic data exports
- Critical data should be backed up regularly

### **6.3 Performance Optimization**
- Indexes are already created for common queries
- Monitor slow queries in production
- Consider connection pooling optimization

---

## **Step 7: Migration from localStorage**

### **7.1 Data Migration Strategy**
The new gamification hook (`useGamificationAPI`) includes:
- **Primary**: Backend API calls
- **Fallback**: localStorage for offline functionality
- **Migration**: Automatic sync when users first use new system

### **7.2 Gradual Rollout**
1. Deploy backend with database
2. Frontend continues using localStorage initially
3. Switch to API-based hook when ready
4. Users' localStorage data serves as backup

---

## **Troubleshooting**

### **Common Issues**

**Connection Refused**
- Check `DATABASE_URL` format
- Verify database service is running
- Ensure backend and database are in same region

**Schema Errors**
- Check PostgreSQL version compatibility
- Verify SQL syntax in schema files
- Check for missing permissions

**Performance Issues**
- Monitor connection pool size
- Check for missing indexes
- Optimize frequent queries

**Authentication Errors**
- Verify JWT token format
- Check Firebase authentication setup
- Ensure user exists in system

---

## **Environment Variables Summary**

### **Backend (.env)**
```env
DATABASE_URL=postgresql://user:pass@host:port/database
NODE_ENV=production
STRIPE_SECRET_KEY=sk_live_...
JWT_SECRET=your-jwt-secret
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### **Frontend (.env.local)**
```env
NEXT_PUBLIC_API_BASE_URL=https://your-backend.onrender.com
NEXT_PUBLIC_PYTHON_ENGINE_URL=https://your-python-engine.onrender.com
NEXT_PUBLIC_FIREBASE_API_KEY=...
# ... other Firebase config
```

---

## **Next Steps**

1. ✅ **Database Created** - PostgreSQL on Render
2. ✅ **Schema Deployed** - Tables and seed data
3. ✅ **Backend Updated** - API endpoints ready
4. ✅ **Frontend Updated** - API-based gamification hook
5. 🔄 **Deploy & Test** - Verify end-to-end functionality
6. 📊 **Monitor** - Check performance and usage
7. 🚀 **Advanced Features** - Leaderboards, challenges, social features

Your gamification system now has a robust, scalable database backend! 🎮
