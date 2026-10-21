import request from 'supertest';
import app from '../src/index';
import { auth } from '../src/auth';

describe('Ingest API', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('RBAC on /ingest routes', () => {
    it('rejects unauthenticated requests with 401', async () => {
      jest.spyOn(auth.api, 'getSession').mockResolvedValue(null as any);

      const res = await request(app).get('/ingest/status');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects regular users with 403', async () => {
      jest.spyOn(auth.api, 'getSession').mockResolvedValue({
        session: { id: 's1' },
        user: { id: 'u1', name: 'User', role: 'user' }
      } as any);

      const res = await request(app).get('/ingest/status');
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('insufficient permissions');
    });

    it('allows moderator or admin on /ingest/status', async () => {
      jest.spyOn(auth.api, 'getSession').mockResolvedValue({
        session: { id: 's1' },
        user: { id: 'u1', name: 'Moderator', role: 'moderator' }
      } as any);

      const res = await request(app).get('/ingest/status');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.tmdb).toHaveProperty('configured');
    });
  });

  describe('Validation & Edge cases', () => {
    beforeEach(() => {
      jest.spyOn(auth.api, 'getSession').mockResolvedValue({
        session: { id: 's1' },
        user: { id: 'u1', name: 'Admin', role: 'admin' }
      } as any);
    });

    it('returns 503 or 400 for invalid TMDB movie ID', async () => {
      const res = await request(app).post('/ingest/tmdb/movie/not-a-number').send({});
      // If TMDB not configured returns 503, otherwise 400
      expect([400, 503]).toContain(res.status);
    });

    it('returns 503 or 400 for TMDB search movie without query', async () => {
      const res = await request(app).post('/ingest/tmdb/search/movie').send({});
      expect([400, 503]).toContain(res.status);
    });

    it('returns 503 or 400 for TMDB search tv without query', async () => {
      const res = await request(app).post('/ingest/tmdb/search/tv').send({});
      expect([400, 503]).toContain(res.status);
    });

    it('returns 400 for wikidata search without query', async () => {
      const res = await request(app).post('/ingest/wikidata/search/movie').send({ query: '' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('query is required');
    });
  });
});
