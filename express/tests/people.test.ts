import request from 'supertest';
import app from '../src/index';
import db from '../src/db';

describe('People API', () => {
  let personId: number;

  beforeAll(() => {
    const info = db.prepare(`
      INSERT INTO people (name, also_known_as, bio)
      VALUES (?, ?, ?)
    `).run('John Doe', 'Johnny', 'A great actor');
    personId = info.lastInsertRowid as number;
  });

  afterAll(() => {
    db.prepare('DELETE FROM people').run();
  });

  it('should return a list of people', async () => {
    const res = await request(app).get('/people');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should fetch a person by id', async () => {
    const res = await request(app).get(`/people/${personId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('name', 'John Doe');
  });

  it('should create a new person', async () => {
    const res = await request(app).post('/people').send({
      name: 'Jane Doe'
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('name', 'Jane Doe');
  });

  it('should not create a person without a name', async () => {
    const res = await request(app).post('/people').send({});
    expect(res.status).toBe(400);
  });

  let newPersonId: number;

  it('should create a new person successfully', async () => {
    const res = await request(app).post('/people').send({
      name: 'Another Doe'
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    newPersonId = res.body.data.id;
  });

  it('should return 409 when creating a person with a duplicate name', async () => {
    const res = await request(app).post('/people').send({
      name: 'Another Doe'
    });
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should update a person', async () => {
    const res = await request(app).put(`/people/${newPersonId}`).send({
      also_known_as: 'Some Nickname'
    });
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('also_known_as', 'Some Nickname');
  });

  it('should return 404 when updating non-existent person', async () => {
    const res = await request(app).put('/people/99999').send({
      name: 'Non Existent'
    });
    expect(res.status).toBe(404);
  });

  it('should delete a person', async () => {
    const res = await request(app).delete(`/people/${newPersonId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 404 when deleting a non-existent person', async () => {
    const res = await request(app).delete('/people/99999');
    expect(res.status).toBe(404);
  });

});
