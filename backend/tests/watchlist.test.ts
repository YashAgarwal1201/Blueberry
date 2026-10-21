import request from 'supertest';
import app from '../src/index';
import db from '../src/db';

describe('Watchlist API', () => {
  let movieId: number;
  let watchlistId: number;

  beforeAll(() => {
    // Insert a movie first to use in watchlist
    const movieInfo = db.prepare(`
      INSERT INTO movies (title, description) VALUES (?, ?)
    `).run('Watchlist Test Movie', 'A movie to watch');
    movieId = movieInfo.lastInsertRowid as number;

    const watchlistInfo = db.prepare(`
      INSERT INTO watchlist (movie_id, status) VALUES (?, ?)
    `).run(movieId, 'want_to_watch');
    watchlistId = watchlistInfo.lastInsertRowid as number;
  });

  afterAll(() => {
    db.prepare('DELETE FROM watchlist').run();
    db.prepare('DELETE FROM movies').run();
  });

  it('should return the watchlist', async () => {
    const res = await request(app).get('/watchlist');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('items');
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThan(0);
  });

  it('should fetch a watchlist item by id', async () => {
    const res = await request(app).get(`/watchlist/${watchlistId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('movie_id', movieId);
  });

  it('should update a watchlist item', async () => {
    const res = await request(app).patch(`/watchlist/${watchlistId}`).send({
      status: 'watched',
      notes: 'Great movie!'
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('status', 'watched');
    expect(res.body.data).toHaveProperty('notes', 'Great movie!');
  });

  it('should return 404 when updating non-existent watchlist item', async () => {
    const res = await request(app).patch('/watchlist/99999').send({
      status: 'watched'
    });
    expect(res.status).toBe(404);
  });

  it('should delete a watchlist item', async () => {
    const res = await request(app).delete(`/watchlist/${watchlistId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should return 404 when deleting a non-existent watchlist item', async () => {
    const res = await request(app).delete('/watchlist/99999');
    expect(res.status).toBe(404);
  });
});
