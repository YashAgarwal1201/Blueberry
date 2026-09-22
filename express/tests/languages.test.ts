import request from 'supertest';
import app from '../src/index';

describe('Languages API', () => {
  it('should return a list of languages', async () => {
    const res = await request(app).get('/languages');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
    // Since languages are seeded on db creation, there should be > 0
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('name');
    expect(res.body.data[0]).toHaveProperty('code');
  });
});
