import request from 'supertest';
import app from '../src/index';
import db from '../src/db';

describe('Movies API', () => {
  beforeAll(() => {
    // Optionally insert some seed data if necessary
    const insertMovie = db.prepare(`
      INSERT INTO movies (title, description, release_year, status) 
      VALUES (?, ?, ?, ?)
    `);
    insertMovie.run('Test Movie', 'A great test movie', 2026, 'released');
  });

  afterAll(() => {
    // Cleanup the database after tests
    db.prepare('DELETE FROM movies').run();
  });

  it('should return a list of movies', async () => {
    const res = await request(app).get('/movies');
    
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('title', 'Test Movie');
  });

  it('should return 404 for a non-existent movie id', async () => {
    const res = await request(app).get('/movies/99999');
    
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('error');
  });

  let newUuid: string;

  it('should create a new movie', async () => {
    const res = await request(app).post('/movies').send({
      title: 'Brand New Movie',
      description: 'A test POST request',
      release_year: 2027
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('uuid');
    newUuid = res.body.data.uuid;
  });

  it('should fail to create a movie without a title', async () => {
    const res = await request(app).post('/movies').send({
      description: 'No title provided'
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should update an existing movie', async () => {
    const res = await request(app).put(`/movies/${newUuid}`).send({
      title: 'Updated Movie Title'
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('title', 'Updated Movie Title');
  });

  it('should return 404 when updating non-existent movie', async () => {
    const res = await request(app).put('/movies/invalid-uuid').send({
      title: 'Should fail'
    });
    expect(res.status).toBe(404);
  });

  it('should delete a movie', async () => {
    const res = await request(app).delete(`/movies/${newUuid}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 404 when deleting a non-existent movie', async () => {
    const res = await request(app).delete('/movies/invalid-uuid');
    expect(res.status).toBe(404);
  });
});
