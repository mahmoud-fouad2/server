import request from 'supertest';
import { app } from '../index';

describe('Health Check', () => {
  it('should return 200 OK', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Fahimo API V2 is running');
  });

  it('should return 404 for unknown route', async () => {
    const res = await request(app).get('/api/unknown-route-123');
    expect(res.status).toBe(404);
  });
});
