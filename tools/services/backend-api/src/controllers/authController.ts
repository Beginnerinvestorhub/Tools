
import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import { ApiError } from '../../../../packages/api-types/src'; // Adjust path if needed

/**
 * Handles user registration.
 * @param req The Express request object.
 * @param res The Express response object.
 * @param next The Express next middleware function.
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            throw new ApiError(400, 'All fields are required for registration.');
        }
        const newUser = await authService.registerUser(username, email, password);
        res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        next(error);
    }
};

/**
 * Handles user login.
 * This endpoint now *expects a Firebase ID Token* in the request body,
 * NOT raw email/password. The `authenticateToken` middleware will verify this.
 * This controller then uses the authenticated user's ID to fetch their profile.
 *
 * @param req The Express request object. It's expected that `req.user.id` is populated
 * by the `authenticateToken` middleware with the Firebase UID.
 * @param res The Express response object.
 * @param next The Express next middleware function.
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // The actual authentication (email/password verification) is done on the frontend
        // using Firebase Client SDK, and then the ID token is sent.
        // The `authenticateToken` middleware *must* have run before this controller.
        const userId = (req as any).user?.id; // Firebase UID attached by authenticateToken middleware

        if (!userId) {
            // This should ideally be caught by authenticateToken middleware before reaching here.
            throw new ApiError(401, 'Authentication required: Firebase ID Token missing or invalid.');
        }

        const user = await authService.loginUser(userId); // Fetch user profile using UID
        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        next(error);
    }
};

/**
 * Handles user logout.
 * For Firebase ID tokens, logout is generally client-side (deleting the token).
 * If using custom backend JWTs, this might invalidate them.
 * @param req The Express request object.
 * @param res The Express response object.
 * @param next The Express next middleware function.
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // No server-side session invalidation needed for stateless JWTs.
        // If you were using Firebase Auth session cookies, you might revoke them here:
        // const userId = (req as any).user?.id;
        // if (userId) {
        //     await admin.auth().revokeRefreshTokens(userId);
        // }
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        next(error);
    }
};

/**
 * Retrieves the currently authenticated user's profile.
 * @param req The Express request object. It's expected that `req.user.id` is populated
 * by the `authenticateToken` middleware with the Firebase UID.
 * @param res The Express response object.
 * @param next The Express next middleware function.
 */
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id; // Firebase UID attached by authenticateToken middleware
        if (!userId) {
            throw new ApiError(401, 'Unauthorized: No user ID found in request. Please provide a valid token.');
        }
        const user = await authService.findUserById(userId);
        if (!user) {
            throw new ApiError(404, 'User profile not found for the authenticated ID.');
        }
        res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
};

