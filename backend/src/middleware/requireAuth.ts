import { Request, Response, NextFunction } from 'express';
import { User } from '../types/user';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Replace this with real auth logic (JWT, sessions, etc)
  const fakeUser: User = {
    id: 'user123',
    email: 'user@example.com',
    // no role here unless you want
  };

  req.user = fakeUser;
  next();
};
