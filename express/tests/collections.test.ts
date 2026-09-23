import request from 'supertest';
import app from '../src/index';
import db from '../src/db';

describe('Collections API', () => {
  let collectionId: number;

  beforeAll(() => {
    const info = db.prepare(`
      INSERT INTO collections (name, slug)
      VALUES (?, ?)
    `).run('Test Collection', 'test-collection');
    collectionId = info.lastInsertRowid as number;
  });

  afterAll(() => {
    db.prepare('DELETE FROM collections').run();
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
