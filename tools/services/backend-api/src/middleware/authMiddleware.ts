// beginnerinvestorhub/tools/services/backend-api/src/middleware/authMiddleware.ts

import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin'; // Ensure Firebase Admin SDK is initialized
import { ApiError } from '../../../../packages/api-types/src'; // Adjust path if needed

// Extend the Request type to include a user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string; // Firebase UID
        email?: string;
        // Add other properties you might store from the ID token if needed
      };
    }
  }
}

/**
 * Middleware to authenticate requests using Firebase ID Tokens.
 *
 * @param req The Express request object.
 * @param res The Express response object.
 * @param next The Express next middleware function.
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new ApiError(401, 'Authentication required: No token provided or invalid format.'));
    }

    const idToken = authHeader.split(' ')[1];

    try {
        // Verify the Firebase ID token
        const decodedToken = await admin.auth().verifyIdToken(idToken);

        // Attach user information to the request object
        req.user = {
            id: decodedToken.uid,
            email: decodedToken.email,
            // You can add more decoded token properties to req.user if useful downstream
        };

        next(); // Proceed to the next middleware/route handler
    } catch (error: any) {
        console.error('Error verifying Firebase ID token:', error.code, error.message);
        if (error.code === 'auth/id-token-expired') {
            return next(new ApiError(401, 'Authentication failed: Token expired.'));
        }
        if (error.code === 'auth/argument-error' || error.code === 'auth/invalid-id-token') {
            return next(new ApiError(401, 'Authentication failed: Invalid token.'));
        }
        // Generic error for other token verification issues
        return next(new ApiError(401, 'Authentication failed: Could not verify token.'));
    }
};

