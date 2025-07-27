import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { requireAuth } from '../utils/requireAuth';
import prisma from '../services/databaseService';
import { validate } from '../middleware/validation';
import { adminSchemas } from '../schemas/validationSchemas';

export const adminRouter = Router();

// All admin routes require authentication and the 'admin' role.
const requireAdmin = requireAuth(['admin']);

// GET /api/admin/dashboard - Get admin dashboard overview data
adminRouter.get('/dashboard', requireAdmin, async (req, res) => {
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
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET /api/admin/users - list all users
adminRouter.get('/users', requireAdmin, async (req, res) => {
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
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/role - update a user's role
adminRouter.post('/role', requireAdmin, validate(adminSchemas.updateRole), async (req, res) => {
  try {
    const { userId, role } = req.body;
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});
