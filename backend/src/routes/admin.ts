import { Router } from 'express';
import { requireAuth } from '../utils/requireAuth';
import { requireRole } from '../middleware/roleAuth';

export const adminRouter = Router();

// In-memory users for demo; replace with DB in production
const users: any[] = [
  { uid: '1', email: 'admin@example.com', role: 'admin' },
  { uid: '2', email: 'user@example.com', role: 'user' },
  { uid: '3', email: 'paid@example.com', role: 'paiduser' },
];

// Require both authentication and 'admin' role
adminRouter.get('/', requireAuth(['admin']), requireRole(['admin']), (req, res) => {
  res.json({ data: 'admin dashboard' });
});

// GET /api/admin/users - list all users
adminRouter.get('/users', requireAuth(['admin']), requireRole(['admin']), (req, res) => {
  res.json({ users });
});

// POST /api/admin/role - update a user's role
adminRouter.post('/role', requireAuth(['admin']), requireRole(['admin']), (req, res) => {
  const { uid, role } = req.body;
  const user = users.find(u => u.uid === uid);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.role = role;
  res.json({ success: true, user });
});
