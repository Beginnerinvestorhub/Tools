// Middleware to validate that req.user.id is present (attached by authentication middleware)
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../../../../packages/api-types/src/simulationTypes';

export const requireUserId = (req: Request, res: Response, next: NextFunction) => {
  if (!(req as any).user?.id) {
    return next(new ApiError(401, 'Unauthorized: User ID not found.'));
  }
  next();
};
