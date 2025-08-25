import { Router, Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { requireAuth } from '../middleware/requireAuth';
import prisma from '../services/databaseService';
import { validate } from '../middleware/validation';
import { adminSchemas } from '../schemas/validationSchemas';
import { NotFoundError } from '../utils/errors';

export const adminRouter = Router();

// All admin routes require authentication and the 'admin' role.
const requireAdmin = requireAuth(['admin']);

// GET /api/admin/dashboard - Get admin dashboard overview data
adminRouter.get('/dashboard', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userCount = await prisma.user.count();
    const portfolioCount = await prisma.portfolio.count();
    const transactionCount = await prisma.transaction.count();

    res.json({
      message: 'Admin Dashboard Data',
      data: {
        userCount,
        portfolioCount,
        transactionCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users - list all users
adminRouter.get('/users', requireAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/role - update a user's role
adminRouter.post('/role', requireAdmin, validate(adminSchemas.updateRole), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, role } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    // The global error handler will catch Prisma's P2025 error (record not found),
    // but we can provide a more specific message here.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return next(new NotFoundError('The specified user does not exist.'));
    }
    next(error);
  }
});
