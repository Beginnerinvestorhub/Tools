// apps/web/src/app/api/auth/[...nextauth].ts

import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'; // Firebase Client SDK Auth

// --- Firebase Client-Side Configuration ---
// Make sure these are loaded from environment variables (e.g., .env.local in apps/web)
// Do NOT hardcode your Firebase configuration here in a production app.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Initialize Firebase App only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app); // Get Firebase Auth instance

// --- NextAuth.js Options ---
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password');
        }

        try {
          // Attempt to sign in with Firebase Client SDK
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );

          const firebaseUser = userCredential.user;

          if (firebaseUser) {
            // After successful Firebase authentication, fetch additional profile data from your backend.
            // This is where your backend's authService.loginUser will be called.
            // We pass the Firebase ID Token so your backend can verify it.
            const idToken = await firebaseUser.getIdToken();

            // Call your backend API to get the user's full profile
            // Make sure your backend API is accessible.
            const backendLoginResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/login`, {
              method: 'POST', // Use POST if your login endpoint needs to be hit, even if it only verifies token
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`, // Send Firebase ID Token to your backend
              },
              // The backend `login` endpoint *now* expects a token in the header, not email/password in body
              // You might still send an empty body or a simple acknowledgment if your backend expects it.
              body: JSON.stringify({ /* No sensitive data here, token is in header */ })
            });

            if (!backendLoginResponse.ok) {
              const errorData = await backendLoginResponse.json();
              throw new Error(errorData.message || 'Failed to fetch user profile from backend.');
            }

            const backendUserData = await backendLoginResponse.json();
            const userProfile = backendUserData.user; // Assuming your backend returns { user: UserProfile }

            // Return a user object that NextAuth.js can store in the session.
            // This object will be available in `session.user`.
            return {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              name: userProfile.username || firebaseUser.displayName, // Prioritize backend profile username
              image: firebaseUser.photoURL, // Optional Firebase user photo
              // Add any other profile data you want accessible on the client-side via session
              ...userProfile, // Merge in other properties from your backend profile
              accessToken: idToken, // Store the Firebase ID Token for direct use if needed (e.g., in API calls)
            };
          }

          return null; // If Firebase user is null, authentication failed
        } catch (error: any) {
          console.error('Firebase Auth or backend profile fetch error:', error);
          if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
            throw new Error('Invalid email or password.');
          }
          if (error.code === 'auth/network-request-failed') {
            throw new Error('Network error. Please check your internet connection.');
          }
          throw new Error(error.message || 'Authentication failed. Please try again.');
        }
      },
    }),
    // You can add other providers here, e.g., GoogleProvider, GitHubProvider, etc.
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // }),
  ],
  callbacks: {
    // Session callback: What data gets put into the session (client-side accessible)
    async jwt({ token, user, account, profile, isNewUser }) {
      // User is only present on first sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        // token.picture = user.image; // Assuming user.image is available
        token.accessToken = (user as any).accessToken; // Store Firebase ID Token
        // You can add other custom properties from your user profile here
        // For example: token.roles = user.roles;
        Object.assign(token, user); // Merge the rest of the user object into the token
      }
      return token;
    },
    async session({ session, token }) {
      // Session object passed to the client
      session.user = {
        id: token.id as string,
        email: token.email as string,
        name: token.name as string,
        // image: token.picture,
        // Ensure other custom properties are passed
        ...token as any, // Merge all properties from the token into the session user
      };
      // Store the Firebase ID Token in the session if needed by frontend
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin', // Custom sign-in page route
    // signOut: '/auth/signout',
    // error: '/auth/error', // Error page
    // verifyRequest: '/auth/verify-request', // Email verification page
    // newUser: '/auth/new-user', // New users page
  },
  session: {
    strategy: 'jwt', // Use JWT for session management (stateless)
    maxAge: 60 * 60 * 24 * 7, // 7 days (default is 30 days, adjust as needed)
  },
  jwt: {
    // Your JWT secret for NextAuth.js internal JWT signing (different from Firebase's)
    secret: process.env.NEXTAUTH_JWT_SECRET,
  },
  secret: process.env.NEXTAUTH_SECRET, // Required for NextAuth.js
  debug: process.env.NODE_ENV === 'development',
};

// The NextAuth handler. For App Router, it's typically exported directly.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

