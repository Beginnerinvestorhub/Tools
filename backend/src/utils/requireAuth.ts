import { Request, Response, NextFunction } from 'express';
import admin from './firebaseAdmin';
import { logger } from '../utils/logger';

// Extend the Express Request interface to include the user property
declare global {
  namespace Express {
    interface Request {
      user?: admin.auth.DecodedIdToken;
    }
  }
}

export const requireAuth = (roles: string[] = []) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authorized, no token provided' });
    }

    try {
      const idToken = authHeader.split(' ')[1];
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      req.user = decodedToken;

      // Role check
      if (roles.length > 0) {
        const userRole = req.user?.role as string; // Assumes 'role' is a custom claim
        if (!userRole || !roles.includes(userRole)) {
          return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }
      }

      next();
    } catch (error) {
      logger.error('Firebase token verification failed', { error });
      res.status(401).json({ error: 'Not authorized, token is invalid or expired' });
    }
  };
};
