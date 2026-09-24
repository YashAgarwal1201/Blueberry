import request from 'supertest';

// Mock auth middleware before importing app
jest.mock('../src/middleware/authMiddleware', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', name: 'Test User' };
    next();
  },
  optionalAuth: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', name: 'Test User' };
    next();
  }
}));

import app from '../src/index';
import db from '../src/db';

describe('Collections API', () => {
  let collectionId: number;
  let movieId: number;

  beforeAll(() => {
    // Insert mock user
    db.prepare(`
      INSERT OR IGNORE INTO "user" (id, name, email, emailVerified, createdAt, updatedAt)
      VALUES ('test-user-id', 'Test User', 'test@test.com', 1, datetime('now'), datetime('now'))
    `).run();

    // Insert mock collection
    const info = db.prepare(`
      INSERT INTO collections (user_id, name, slug)
      VALUES (?, ?, ?)
    `).run('test-user-id', 'Test Collection', 'test-collection');
    collectionId = info.lastInsertRowid as number;

    // Insert mock movie
    const mInfo = db.prepare(`
      INSERT INTO movies (title, description) VALUES (?, ?)
    `).run('Collection Test Movie', 'Movie description');
    movieId = mInfo.lastInsertRowid as number;
  });

  afterAll(() => {
    db.prepare('DELETE FROM collection_items').run();
    db.prepare('DELETE FROM collections').run();
    db.prepare('DELETE FROM movies WHERE id = ?').run(movieId);
    db.prepare('DELETE FROM "user" WHERE id = ?').run('test-user-id');
  });

  it('should return a list of collections', async () => {
    const res = await request(app).get('/collections');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should fetch a collection by id', async () => {
    const res = await request(app).get(`/collections/${collectionId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('name', 'Test Collection');
  });

  let newCollectionId: number;

  it('should create a new collection', async () => {
    const res = await request(app).post('/collections').send({
      name: 'New Collection'
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('name', 'New Collection');
    newCollectionId = res.body.data.id;
  });

  it('should fail to create a collection without a name', async () => {
    const res = await request(app).post('/collections').send({});
    expect(res.status).toBe(400);
  });

  it('should update a collection', async () => {
    const res = await request(app).put(`/collections/${newCollectionId}`).send({
      description: 'A test description'
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('description', 'A test description');
  });

  it('should return 404 when updating non-existent collection', async () => {
    const res = await request(app).put('/collections/99999').send({
      name: 'Should Fail'
    });
    expect(res.status).toBe(404);
  });

  it('should add an item to a collection', async () => {
    const res = await request(app).post(`/collections/${newCollectionId}/items`).send({
      movie_id: movieId
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(1);
    expect(res.body.data.items[0]).toHaveProperty('title', 'Collection Test Movie');
  });

  it('should remove an item from a collection', async () => {
    const res = await request(app).delete(`/collections/${newCollectionId}/items`).send({
      movie_id: movieId
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBe(0);
  });

  it('should reorder a collection', async () => {
    // Add item back first
    await request(app).post(`/collections/${newCollectionId}/items`).send({ movie_id: movieId });

    const res = await request(app).put(`/collections/${newCollectionId}/reorder`).send({
      items: [
        { movie_id: movieId, display_order: 5 }
      ]
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should delete a collection', async () => {
    const res = await request(app).delete(`/collections/${newCollectionId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 404 when deleting a non-existent collection', async () => {
    const res = await request(app).delete('/collections/99999');
    expect(res.status).toBe(404);
  });
});
