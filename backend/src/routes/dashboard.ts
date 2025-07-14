import { Router } from 'express';
import { requireAuth } from '../utils/requireAuth';

export const dashboardRouter = Router();

dashboardRouter.get('/', requireAuth(['user', 'paiduser']), (req, res) => {
  // Example: Return dashboard data
  res.json({ data: 'dashboard data' });
});
