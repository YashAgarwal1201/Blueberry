import request from 'supertest';
import app from '../src/index';

describe('Health API', () => {
  it('should return a 200 OK and healthy status', async () => {
    const res = await request(app).get('/health');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('message', 'Server is healthy.');
    expect(res.body).toHaveProperty('timestamp');
  });
});
