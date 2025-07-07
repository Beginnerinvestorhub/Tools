// beginnerinvestorhub/tools/services/backend-api/src/services/authService.ts

// No longer need bcrypt here if Firebase Auth handles all password hashing
// import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken'; // Still needed if your backend issues its own JWTs for some reason, or for custom tokens
import { ApiError } from '../../../../packages/api-types/src';
import * as dbService from './dbService'; // Import dbService
import { User } from '../models/userModel'; // Assuming your User model interface/type

// For Firebase authentication, we primarily rely on the Admin SDK's auth
// to verify tokens and manage users. The frontend will typically use the
// Firebase Client SDK for direct user login/registration.

/**
 * Registers a new user via Firebase Authentication and creates their profile in Firestore.
 * This function is called by the backend controller when a new user signs up.
 *
 * @param username The user's chosen username.
 * @param email The user's email address.
 * @param password The user's plain-text password.
 * @returns The newly created user's profile data (without password).
 * @throws ApiError if email already exists or for other Firebase Auth creation errors.
 */
export const registerUser = async (username: string, email: string, password: string): Promise<Omit<User, 'password'>> => {
    try {
        // dbService.createUser now encapsulates Firebase Auth user creation
        // and saving additional profile data to Firestore.
        const newUserProfile = await dbService.createUser({ username, email, password });
        return newUserProfile;
    } catch (error: any) {
        console.error('Registration failed in authService:', error.message);
        if (error.message.includes('auth/email-already-exists')) {
            throw new ApiError(409, 'A user with this email already exists.');
        }
        // Catch other Firebase Auth errors specifically if needed
        throw new ApiError(500, 'Failed to register user. Please try again.');
    }
};

/**
 * Handles user login *after* Firebase Authentication has verified credentials on the frontend.
 * This function's primary purpose would be to retrieve the user's profile data
 * from Firestore once their Firebase ID Token has been validated by the backend.
 *
 * It does NOT directly take email/password for login verification.
 * Frontend is expected to send Firebase ID Token to backend.
 *
 * @param userId The Firebase UID of the authenticated user (obtained from a verified ID Token).
 * @returns The user's profile data from Firestore.
 * @throws ApiError if user profile not found.
 */
export const loginUser = async (userId: string): Promise<Omit<User, 'password'>> => {
    try {
        // Find the user's profile data in Firestore using their UID
        const userProfile = await dbService.findUserById(userId);

        if (!userProfile) {
            // This scenario should ideally not happen if Firebase Auth succeeded,
            // but it's a fallback if Firestore profile creation failed for some reason.
            throw new ApiError(404, 'User profile not found after authentication.');
        }

        // Return the user's profile without the password (even though it's not stored in Firestore directly)
        const { password: _, ...userWithoutPassword } = userProfile;
        return userWithoutPassword;
    } catch (error: any) {
        console.error('Login user profile retrieval failed in authService:', error.message);
        // If it's an ApiError already, re-throw it. Otherwise, wrap it.
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, 'Failed to retrieve user profile after login.');
    }
};


/**
 * Finds a user by their ID (Firebase UID).
 * This is typically used by authentication middleware to retrieve user details
 * after a token has been verified.
 *
 * @param userId The ID of the user (Firebase UID).
 * @returns The user object (without sensitive data like password) or null if not found.
 */
export const findUserById = async (userId: string): Promise<Omit<User, 'password'> | null> => {
    // dbService.findUserById already fetches from Firestore
    const user = await dbService.findUserById(userId);
    if (!user) {
        return null;
    }
    // Ensure the returned object doesn't have a 'password' field, even if the model defines it as optional.
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

// You might consider adding a logout function here if you manage sessions/tokens
// but for JWTs, logout is often handled client-side by deleting the token.
// If your backend issues custom JWTs after Firebase auth, you might have
// a mechanism to invalidate those here.

