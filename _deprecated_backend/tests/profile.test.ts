import request from 'supertest';
import app from '../src/index';

describe('Profile API', () => {
  it('should reject unauthenticated profile fetch', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(401);
  });

  it('should get profile for authenticated user', async () => {
    const token = 'mocked_jwt'; // Replace with real or mocked JWT
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('username');
  });

  it('should update profile for authenticated user', async () => {
    const token = 'mocked_jwt';
    const updates = { bio: 'Updated bio' };
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(updates);
    expect(res.status).toBe(200);
    expect(res.body.bio).toBe('Updated bio');
  });

  it('should handle invalid JWT on profile fetch', async () => {
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });
});
