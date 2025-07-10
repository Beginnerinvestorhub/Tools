import request from 'supertest';
import app from '../app';

describe('API Health Check', () => {
  it('should return API running message', async () => {
    const res = await request(app).get('/api');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message', 'Beginner Investor Hub Backend API is running!');
  });
});
