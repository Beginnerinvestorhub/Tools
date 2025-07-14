import request from 'supertest';
import app from '../src/index';

describe('Auth API', () => {
  it('should reject unauthenticated access to protected route', async () => {
    const res = await request(app).get('/api/profile');
    expect(res.status).toBe(401);
  });

  it('should allow user to sign up', async () => {
    const newUser = { username: 'testuser', password: 'testpass' };
    const res = await request(app)
      .post('/api/auth/signup')
      .send(newUser);
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('token');
  });

  it('should allow user to log in and return JWT', async () => {
    const credentials = { username: 'testuser', password: 'testpass' };
    const res = await request(app)
      .post('/api/auth/login')
      .send(credentials);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should reject login with invalid credentials', async () => {
    const credentials = { username: 'wronguser', password: 'wrongpass' };
    const res = await request(app)
      .post('/api/auth/login')
      .send(credentials);
    expect(res.status).toBe(401);
  });

  it('should reject access with invalid JWT', async () => {
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', 'Bearer invalidtoken');
    expect(res.status).toBe(401);
  });
});
