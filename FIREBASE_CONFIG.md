# Firebase Configuration for Deployment

## Frontend Environment Variables (Vercel)

Use these values in your Vercel dashboard:

```bash
# Firebase Configuration (from your Firebase console)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAwatQASRMtJKkrATJXrpNUzzG2VxSYCf0
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=beginnerinvestorhub-8ce1f.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=beginnerinvestorhub-8ce1f
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=beginnerinvestorhub-8ce1f.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=807595603132
NEXT_PUBLIC_FIREBASE_APP_ID=1:807595603132:web:6a2be21962544669f9ccb9

# Google Analytics
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-S2FYWXCWGB

# API URLs (update with your Railway service URLs)
NEXT_PUBLIC_API_BASE_URL=https://your-backend-service.railway.app
NEXT_PUBLIC_PYTHON_ENGINE_URL=https://your-python-engine.railway.app

# App Configuration
NEXT_PUBLIC_APP_NAME="Beginner Investor Hub"
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Backend Environment Variables (Railway)

Use these values in your Railway backend service:

```bash
# Firebase Admin SDK (from service account file)
FIREBASE_PROJECT_ID=beginnerinvestorhub-8ce1f
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@beginnerinvestorhub-8ce1f.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCqzAPgn0r3XYlW\nGHfwQjYaxkFPWoN49Mis5LUdcfUFPGgiKiiCFOpIc6ZgFsg7K/0UG9T9WQhUL8cS\nibYWwkBjvTJKSW8aBIlvEe21gks5qvESQMtN3vjMPbqhuA5w0OurZ14yVV1IMX1K\nM3vR+Xx0E6CDWU2IbfdMpoyHKBJ8FN6eGzVKBwSXQcCPGJPa5D01hLNuuqxfsqU5\nI8bGtg/Pqm5Bb2qA/cWA/HyGPHeZZ+krgwKrfrSUfRDqs6vTHVnCSAfpydhL5Ntj\nSYv3UDuD52F52hXuf0He31FGx7uh0yh2tWVsfk5+yvzG+qaHOtMsTcRU87c4BYtw\n3fSJjUxNAgMBAAECggEANV02Du4mUaCHgv91JfvCBN6R1FXfAyFUO/Tfg9oxqJel\nn5sVegNH6ig8QQSNPjOxyKEjjJ7PQ+KDrA6b9oNt89vOxTgpfvMQ78OlxlL15wg6\ndy4Id4WlrcbRs6qa1HPqVm0fGNHkKeTQlSj91G7DjE7/lVqHJ4vYOzpEaQxDrkGi\nNU4uW0bg6zlXBkwFdEPweVDw/QXmASBhyd0D+yZBCPma+12zLakbkXkz8MbIAxMm\nO1DJgJzfp+31UXFstrQjQjSj5QrgDSRmZ1N/PswWHcqXLpoD+uMcpUqCWYB/2yUp\nZnAs+QnPWFse48DQiJ+LnITkFeNCgvAUTKpjD56AzwKBgQDbZ1VhfmKmxWIRI8M8\na8IjvoH2KR3D5xVmActsRGeBZZWyYs4s7WUBnX7BZCTqWABOBKF6jxweremp5eM7\nEG2Ejt8zREU8twepFp6EU8BR8le99zYhnLbqV8iGxSrFUGmef61PycP3QhACoqLX\njP9UocPICpqoaxbKg8yIYj4iWwKBgQDHSSViqG1F+7PjG46BIaPZk2XaO8s9nEJe\ntlaJU9PFQIwROnStFbi+J8fZ2ebiM/tNbssEgiXVlTEThkbtcVS/vJJa8TV0nk3D\n4Laf6uH4opyFwlLogy1opPLNSBlUNqhPxCpqn1x9Gqf+7PS7UyvutaPdFn2vIB1N\nZzr4cjo8dwKBgQDGgOFQyeY7eM3XMAIOAnitmkk/C8gwXDySBAGmPOVgvyYHNTnQ\nkCAYrAPouNBlbaUo8SugFSad4z9LRgCmiaBslE8AtT3nRrmZlCtrEdMo0RfteWLy\nWjVsJGv68xxVVQGaM238iFHSvWR63eZzGtBQI+Ncc6ulwO3n4AMHSctpjQKBgQCl\nWONUADrqHfUbMfoC2k6Ab/PKJmJzM/s9ajxSpOLIfs24XbABDEzEOW1wK4ONm2Oe\n05ZOn02U8LxPXtHqoGWY0HT+T7PyloYfR4s/FDt5eDI2KQ1xLaW3dWSfPnsFjHQJ\n+tDWtnKeukc5FJHZ+yAwZzUWc1rEuviVCFm9WclH8QKBgQCK5s/hGUq8tPK7bta0\nePPAmheYzHPYqsge/k0mI71B7eg/czOrWNqzYqwnEOjs13Ri2Q3peBfrntq5OjU7\nDUz0u7w4oql+0K/DvKuNcoJYRkIml1P5thoIc+jJGRHwrnzmgzwcvwJ7oh29rKpC\n3VPOfNZHKTMuznCdqEyZh/RF2w==\n-----END PRIVATE KEY-----\n"

# Server Configuration
NODE_ENV=production
PORT=4000
JWT_SECRET=your_super_secure_jwt_secret_at_least_32_characters_long

# CORS Configuration (update with your Vercel URL)
FRONTEND_URL=https://your-app.vercel.app
ALLOWED_ORIGINS=https://your-app.vercel.app

# Database (Railway will provide these)
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

## Next Steps

1. **Deploy to Railway** with backend environment variables
2. **Deploy to Vercel** with frontend environment variables  
3. **Update CORS settings** with actual Vercel URL
4. **Test Firebase authentication** and analytics

Your Firebase configuration is now complete!
