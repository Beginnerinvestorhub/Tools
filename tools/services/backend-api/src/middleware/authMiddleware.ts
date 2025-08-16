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

    // Check for authorization header
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new ApiError(401, 'Authentication required: No token provided or invalid format.'));
    }

    const idToken = authHeader.split(' ')[1];

    // Validate token format (basic check)
    if (!idToken || idToken.length < 10) {
        return next(new ApiError(401, 'Authentication failed: Invalid token format.'));
    }

    try {
        // Verify the Firebase ID token with additional security checks
        // Check that the token was issued recently (optional security measure)
        const decodedToken = await admin.auth().verifyIdToken(idToken, true /** checkRevoked */);

        // Additional security checks
        const now = Math.floor(Date.now() / 1000);
        
        // Check if token was issued recently (within 1 hour)
        if (decodedToken.iat && (now - decodedToken.iat > 3600)) {
            return next(new ApiError(401, 'Authentication failed: Token too old.'));
        }

        // Check if token is not yet valid (future dated)
        if (decodedToken.nbf && decodedToken.nbf > now) {
            return next(new ApiError(401, 'Authentication failed: Token not yet valid.'));
        }

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
        if (error.code === 'auth/user-disabled') {
            return next(new ApiError(401, 'Authentication failed: User account disabled.'));
        }
        if (error.code === 'auth/id-token-revoked') {
            return next(new ApiError(401, 'Authentication failed: Token revoked.'));
        }
        // Generic error for other token verification issues
        return next(new ApiError(401, 'Authentication failed: Could not verify token.'));
    }
};

