import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function requireAuth(roles: string[] = []) {
  return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Missing token' });
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      // @ts-ignore
      req.user = decoded;
      if (roles.length && !roles.includes((decoded as any).role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    } catch (e: any) {
      // Only handle JWT errors here. Log unexpected errors for debugging.
      if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      // Log unexpected errors and rethrow for global error handler
      console.error('Unexpected error in requireAuth:', e);
      throw e;
    }
  };
}
