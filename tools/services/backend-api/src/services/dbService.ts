
import * as admin from 'firebase-admin';

import { IRiskProfile } from '../models/riskProfileModel';
import { ISimulation } from '../models/simulationModel';


// Load environment variables (ensure dotenv.config() is called in app.ts or server.ts before this is imported)
// In a production setup, Firebase credentials might be automatically loaded by the environment (e.g., Google Cloud Functions)
// For local development, you'll rely on dotenv.

let db: admin.firestore.Firestore;
let auth: admin.auth.Auth;

/**
 * Initializes the Firebase Admin SDK.
 * This function should be called once at the application startup (e.g., in server.ts).
 */
export const connectDB = () => {
    try {
        if (!admin.apps.length) { // Check if Firebase app is already initialized
            const firebaseCredentialsString = process.env.FIREBASE_CREDENTIALS;

            if (!firebaseCredentialsString) {
                console.error('FIREBASE_CREDENTIALS environment variable is not set. Cannot initialize Firebase.');
                process.exit(1);
            }

            const serviceAccount = JSON.parse(firebaseCredentialsString);

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                // You can add other configurations here, e.g., databaseURL for Realtime Database
                // databaseURL: "https://your-project-id.firebaseio.com"
            });
            console.log('Firebase Admin SDK initialized successfully.');
        } else {
            console.log('Firebase Admin SDK already initialized.');
        }
        db = admin.firestore();
        auth = admin.auth(); // Initialize Firebase Auth if you plan to use it for server-side user management
    } catch (err: any) {
        console.error('Error initializing Firebase Admin SDK or parsing credentials:', err.message);
        // Do not exit in production, but handle the error appropriately
        process.exit(1); // Exit for development to highlight config issues
    }
};

// --- User Model Operations (using Firestore for users and Firebase Auth for authentication) ---

export const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
    // When using Firebase Auth for actual user accounts, you'd create the user there.
    // Firestore would then store additional profile data linked by UID.

    try {
        // Create user in Firebase Authentication
        const userRecord = await auth.createUser({
            email: userData.email,
            password: userData.password, // Firebase Auth handles hashing
            displayName: userData.username,
            // ... other auth properties
        });

        const newUserRef = db.collection('users').doc(userRecord.uid);
        const newUser: User = {
            id: userRecord.uid, // Use Firebase Auth UID as the document ID
            email: userData.email,
            username: userData.username,
            // Password is not stored directly in Firestore for security
            // Add any other user profile fields here
            createdAt: admin.firestore.FieldValue.serverTimestamp() as any, // Use server timestamp
            updatedAt: admin.firestore.FieldValue.serverTimestamp() as any,
        };

        // Save additional user profile data to Firestore
        await newUserRef.set(newUser);

        // The returned User object should not contain the password
        const { password: _, ...userWithoutPassword } = newUser;
        return userWithoutPassword as User; // Cast to ensure it matches the Omit type
    } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
            throw new Error('Email already exists.'); // Or use your ApiError
        }
        console.error('Error creating user in Firebase:', error);
        throw new Error('Failed to create user.'); // Or use your ApiError
    }
};

export const findUserByEmail = async (email: string): Promise<User | null> => {
    try {
        // First try to get from Firebase Auth (for authentication checks)
        const userRecord = await auth.getUserByEmail(email);
        if (userRecord) {
            // Then fetch additional profile data from Firestore
            const userDoc = await db.collection('users').doc(userRecord.uid).get();
            if (userDoc.exists) {
                return { id: userDoc.id, ...(userDoc.data() as Omit<User, 'id'>) };
            }
        }
        return null;
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            return null; // User not found in Auth
        }
        console.error('Error finding user by email:', error);
        throw new Error('Failed to retrieve user by email.'); // Or use your ApiError
    }
};

export const findUserById = async (id: string): Promise<User | null> => {
    try {
        const userDoc = await db.collection('users').doc(id).get();
        if (userDoc.exists) {
            return { id: userDoc.id, ...(userDoc.data() as Omit<User, 'id'>) };
        }
        return null;
    } catch (error) {
        console.error('Error finding user by ID:', error);
        throw new Error('Failed to retrieve user by ID.'); // Or use your ApiError
    }
};


// --- Risk Profile Model Operations (using Firestore) ---

export const createOrUpdateRiskProfile = async (userId: string, data: Partial<RiskProfile>): Promise<RiskProfile> => {
    const riskProfileRef = db.collection('riskProfiles').doc(userId);
    const riskProfileData = {
        ...data,
        user: userId,
        recommendations: data.recommendations || [],
        answers: data.answers || {},
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await riskProfileRef.set(riskProfileData, { merge: true });
    const doc = await riskProfileRef.get();
    return doc.data() as RiskProfile;
};

export const getRiskProfileByUserId = async (userId: string): Promise<RiskProfile | null> => {
    const doc = await db.collection('riskProfiles').doc(userId).get();
    if (!doc.exists) return null;
    const data = doc.data() as RiskProfile;
    return {
        ...data,
        recommendations: data.recommendations || [],
        answers: data.answers || {}
    };
};

// --- Simulation Model Operations (using Firestore) ---

export const createSimulation = async (simulationData: Omit<Simulation, 'id' | 'createdAt'>): Promise<Simulation> => {
    const simulationsRef = db.collection('simulations');
    const newSimulationDoc = await simulationsRef.add({
        ...simulationData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const docSnapshot = await newSimulationDoc.get();
    return { id: docSnapshot.id, ...(docSnapshot.data() as Omit<Simulation, 'id'>) } as Simulation;
};

export const getSimulationsByUserId = async (userId: string): Promise<Simulation[]> => {
    const snapshot = await db.collection('simulations').where('userId', '==', userId).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Simulation, 'id'>) } as Simulation));
};

export const getSimulationById = async (id: string): Promise<Simulation | null> => {
    const doc = await db.collection('simulations').doc(id).get();
    if (doc.exists) {
        return { id: doc.id, ...(doc.data() as Omit<Simulation, 'id'>) } as Simulation;
    }
    return null;
};

// --- Market Data Model Operations (Placeholder - depends on your market data strategy) ---

export const getMarketDataForAssets = async (assetSymbols: string[]): Promise<MarketData[]> => {
    // This is highly dependent on how your market-data-ingestion service stores data.
    // Example: If market data is in a 'marketData' collection, each document being a stock.
    // You might fetch historical data for each symbol.
    console.log(`dbService: Fetching market data for: ${assetSymbols.join(', ')}`);

    // Placeholder: Return empty or mock data until actual implementation
    return [];
};

