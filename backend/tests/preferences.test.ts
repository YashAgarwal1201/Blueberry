import request from 'supertest';
import app from '../src/index';
import db from '../src/db';

describe('Preferences API', () => {
  beforeAll(() => {
    // Insert dummy user to match the mocked auth session
    db.prepare(`
      INSERT INTO "user" (id, name, email, emailVerified, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'test-user-id',
      'Test User',
      'test@example.com',
      1,
      new Date().toISOString(),
      new Date().toISOString()
    );
  });

  afterAll(() => {
    db.prepare(`DELETE FROM "user"`).run();
  });

  it('should fetch user preferences', async () => {
    const res = await request(app).get('/api/preferences');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('preferences');
  });

  it('should update user preferences', async () => {
    const res = await request(app).put('/api/preferences').send({
      theme: 'dark',
      notifications: true
    });
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.preferences).toHaveProperty('theme', 'dark');
    expect(res.body.preferences).toHaveProperty('notifications', true);
  });

  it('should fail to update preferences with invalid payload', async () => {
    // String instead of object
    const res = await request(app).put('/api/preferences').send("invalid");
    
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
