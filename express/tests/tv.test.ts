import request from 'supertest';
import app from '../src/index';
import db from '../src/db';

describe('TV API', () => {
  beforeAll(() => {
    const insertShow = db.prepare(`
      INSERT INTO tv_shows (title, uuid, first_air_date) 
      VALUES (?, ?, ?)
    `);
    insertShow.run('Test Show', 'test-tv-uuid-1234', '2026-01-01');
  });

  afterAll(() => {
    db.prepare('DELETE FROM tv_shows').run();
  });

  it('should return recent tv shows', async () => {
    const res = await request(app).get('/tv/recent');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should return top-rated tv shows', async () => {
    const res = await request(app).get('/tv/top-rated');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should return a specific tv show by uuid', async () => {
    const res = await request(app).get('/tv/test-tv-uuid-1234');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('title', 'Test Show');
  });

  it('should return 404 for a non-existent tv show', async () => {
    const res = await request(app).get('/tv/non-existent-uuid');
    
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
  });
});
