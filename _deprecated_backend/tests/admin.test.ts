import request from 'supertest';
import app from '../src/index';

describe('Admin API', () => {
  it('should reject non-admin access to admin route', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('should allow admin to fetch user list', async () => {
    const adminToken = 'mocked_admin_jwt'; // Replace with real or mocked JWT
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should handle invalid token gracefully', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });

  it('should allow admin to create a user', async () => {
    const adminToken = 'mocked_admin_jwt';
    const newUser = { username: 'newuser', password: 'password123', role: 'user' };
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newUser);
    expect([200, 201]).toContain(res.status);
    expect(res.body.username).toBe('newuser');
  });

  it('should allow admin to update a user', async () => {
    const adminToken = 'mocked_admin_jwt';
    const userId = 'mocked_user_id';
    const updates = { role: 'admin' };
    const res = await request(app)
      .put(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updates);
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('admin');
  });

  it('should allow admin to delete a user', async () => {
    const adminToken = 'mocked_admin_jwt';
    const userId = 'mocked_user_id';
    const res = await request(app)
      .delete(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 204]).toContain(res.status);
  });
});
