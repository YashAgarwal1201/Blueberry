import request from 'supertest';
import app from '../src/index';
import db from '../src/db';

describe('Watchlist API', () => {
  let movieId: number;
  let watchlistId: number;

  beforeAll(() => {
    // Seed test users
    db.prepare(`
      INSERT OR IGNORE INTO "user" (id, name, email, emailVerified, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run('test-user-id', 'Test User', 'test@blueberry.local', 1);

    db.prepare(`
      INSERT OR IGNORE INTO "user" (id, name, email, emailVerified, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run('user-2', 'Second User', 'user2@blueberry.local', 1);

    // Insert a movie first to use in watchlist
    const movieInfo = db.prepare(`
      INSERT INTO movies (title, description) VALUES (?, ?)
    `).run('Watchlist Test Movie', 'A movie to watch');
    movieId = movieInfo.lastInsertRowid as number;

    const watchlistInfo = db.prepare(`
      INSERT INTO watchlist (user_id, movie_id, status) VALUES (?, ?, ?)
    `).run('test-user-id', movieId, 'want_to_watch');
    watchlistId = watchlistInfo.lastInsertRowid as number;
  });

  afterAll(() => {
    db.prepare('DELETE FROM watchlist').run();
    db.prepare('DELETE FROM movies').run();
    db.prepare('DELETE FROM "user" WHERE id IN (?, ?)').run('test-user-id', 'user-2');
  });

  it('should return the watchlist for the authenticated user', async () => {
    const res = await request(app).get('/watchlist');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('items');
    expect(Array.isArray(res.body.data.items)).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThan(0);
    expect(res.body.data.items[0]).toHaveProperty('movie_id', movieId);
  });

  it('should fetch a watchlist item by id for the item owner', async () => {
    const res = await request(app).get(`/watchlist/${watchlistId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('movie_id', movieId);
  });

  it('should update a watchlist item for the item owner', async () => {
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

  describe('Multi-tenant isolation', () => {
    it('should isolate watchlists between different users', async () => {
      // user-2 has not added anything yet
      const res = await request(app)
        .get('/watchlist')
        .set('x-test-user-id', 'user-2');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.items).toEqual([]);
    });

    it('should prevent user B from fetching user A watchlist item by id', async () => {
      const res = await request(app)
        .get(`/watchlist/${watchlistId}`)
        .set('x-test-user-id', 'user-2');

      expect(res.status).toBe(404);
    });

    it('should prevent user B from updating user A watchlist item', async () => {
      const res = await request(app)
        .patch(`/watchlist/${watchlistId}`)
        .set('x-test-user-id', 'user-2')
        .send({ status: 'want_to_watch', notes: 'Hacked!' });

      expect(res.status).toBe(404);

      // Verify user A's item remains unchanged
      const ownerCheck = await request(app).get(`/watchlist/${watchlistId}`);
      expect(ownerCheck.body.data.notes).toBe('Great movie!');
    });

    it('should prevent user B from deleting user A watchlist item', async () => {
      const res = await request(app)
        .delete(`/watchlist/${watchlistId}`)
        .set('x-test-user-id', 'user-2');

      expect(res.status).toBe(404);

      // Verify item still exists for owner
      const ownerCheck = await request(app).get(`/watchlist/${watchlistId}`);
      expect(ownerCheck.status).toBe(200);
    });

    it('should allow user B to add the same movie without collision or 409 conflict', async () => {
      const res = await request(app)
        .post('/watchlist')
        .set('x-test-user-id', 'user-2')
        .send({
          movie_id: movieId,
          status: 'want_to_watch'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('movie_id', movieId);

      // Verify user-2 now has 1 item
      const user2List = await request(app)
        .get('/watchlist')
        .set('x-test-user-id', 'user-2');

      expect(user2List.body.data.items.length).toBe(1);
      expect(user2List.body.data.items[0].status).toBe('want_to_watch');

      // Verify user A's item is still status: 'watched'
      const userAList = await request(app).get('/watchlist');
      expect(userAList.body.data.items.length).toBe(1);
      expect(userAList.body.data.items[0].status).toBe('watched');
    });
  });

  it('should delete a watchlist item for owner', async () => {
    const res = await request(app).delete(`/watchlist/${watchlistId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  it('should return 404 when deleting a non-existent watchlist item', async () => {
    const res = await request(app).delete('/watchlist/99999');
    expect(res.status).toBe(404);
  });
});
