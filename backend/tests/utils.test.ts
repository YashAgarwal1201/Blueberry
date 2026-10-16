import { clean } from '../src/utils/stringUtils';
import { getErrorMessage } from '../src/utils/errors';
import { tmdbImage, tmdbYoutube, resolveImage } from '../src/utils/imageUtils';
import { getMovieWatchlistSet, getShowWatchlistSet, invalidateWatchlistCache } from '../src/utils/watchlistCache';
import { getMovieBlockCondition, getBlockConditions, getTvBlockConditions } from '../src/utils/preferences';
import { loggerMiddleware } from '../src/middleware/logger-middleware';
import db from '../src/db';
import { Hono } from 'hono';

describe('Backend Utilities', () => {
  describe('stringUtils - clean', () => {
    it('returns null for undefined or null', () => {
      expect(clean(undefined)).toBeNull();
      expect(clean(null)).toBeNull();
    });

    it('returns null for empty or whitespace-only strings', () => {
      expect(clean('')).toBeNull();
      expect(clean('   ')).toBeNull();
    });

    it('returns trimmed string for valid inputs', () => {
      expect(clean('  Hello World  ')).toBe('Hello World');
      expect(clean('Movie Title')).toBe('Movie Title');
    });
  });

  describe('errors - getErrorMessage', () => {
    it('extracts message from Error object', () => {
      const err = new Error('Database connection failed');
      expect(getErrorMessage(err)).toBe('Database connection failed');
    });

    it('returns string when err is a string', () => {
      expect(getErrorMessage('Simple error string')).toBe('Simple error string');
    });

    it('returns default fallback for unknown types', () => {
      expect(getErrorMessage({ foo: 'bar' })).toBe('Internal server error');
    });

    it('returns custom fallback when provided', () => {
      expect(getErrorMessage(null, 'Custom error')).toBe('Custom error');
    });
  });

  describe('imageUtils', () => {
    it('tmdbImage handles null, empty, http URLs, and tmdb paths', () => {
      expect(tmdbImage(null)).toBeNull();
      expect(tmdbImage(undefined)).toBeNull();
      expect(tmdbImage('https://external.com/poster.jpg')).toBe('https://external.com/poster.jpg');
      expect(tmdbImage('/path123.jpg')).toBe('https://image.tmdb.org/t/p/w500/path123.jpg');
      expect(tmdbImage('/path123.jpg', 'original')).toBe('https://image.tmdb.org/t/p/original/path123.jpg');
    });

    it('tmdbYoutube handles key and null', () => {
      expect(tmdbYoutube(null)).toBeNull();
      expect(tmdbYoutube('dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    it('resolveImage prioritizes tmdbPath over localUrl', () => {
      expect(resolveImage('/tmdb.jpg', '/local.jpg')).toBe('https://image.tmdb.org/t/p/w500/tmdb.jpg');
      expect(resolveImage(null, '/local.jpg')).toBe('/local.jpg');
      expect(resolveImage(null, null)).toBeNull();
    });
  });

  describe('watchlistCache', () => {
    it('manages movie and show watchlist sets and invalidation', () => {
      invalidateWatchlistCache();
      const movieSet = getMovieWatchlistSet();
      expect(movieSet instanceof Set).toBe(true);

      const cachedMovieSet = getMovieWatchlistSet();
      expect(cachedMovieSet).toBe(movieSet); // Same cached instance

      const showSet = getShowWatchlistSet();
      expect(showSet instanceof Set).toBe(true);

      const cachedShowSet = getShowWatchlistSet();
      expect(cachedShowSet).toBe(showSet); // Same cached instance

      invalidateWatchlistCache();
      const freshMovieSet = getMovieWatchlistSet();
      expect(freshMovieSet instanceof Set).toBe(true);
    });
  });

  describe('preferences', () => {
    beforeAll(() => {
      // Insert test user with preferences
      db.prepare(`
        INSERT OR REPLACE INTO "user" (id, name, email, emailVerified, createdAt, updatedAt, preferences)
        VALUES (
          'pref-test-user',
          'Pref User',
          'pref@example.com',
          1,
          datetime('now'),
          datetime('now'),
          '{"blockedGenres":["horror"],"blockedLanguages":["fr"],"blockedMovies":["blocked-uuid-1"],"blockedShows":["blocked-show-uuid"]}'
        )
      `).run();
    });

    afterAll(() => {
      db.prepare(`DELETE FROM "user" WHERE id = 'pref-test-user'`).run();
    });

    it('returns undefined/empty conditions when no userId is passed', () => {
      expect(getMovieBlockCondition()).toBeUndefined();
      expect(getBlockConditions().clause).toBe('');
      expect(getTvBlockConditions().clause).toBe('');
    });

    it('generates raw SQL block conditions for movie queries', () => {
      const conditions = getBlockConditions('pref-test-user');
      expect(conditions.clause).toContain('m.id NOT IN');
      expect(conditions.clause).toContain('m.uuid NOT IN');
      expect(conditions.params).toContain('horror');
      expect(conditions.params).toContain('fr');
      expect(conditions.params).toContain('blocked-uuid-1');
    });

    it('generates raw SQL block conditions for TV queries', () => {
      const conditions = getTvBlockConditions('pref-test-user');
      expect(conditions.clause).toContain('t.id NOT IN');
      expect(conditions.clause).toContain('t.uuid NOT IN');
      expect(conditions.params).toContain('horror');
      expect(conditions.params).toContain('fr');
      expect(conditions.params).toContain('blocked-show-uuid');
    });

    it('generates Drizzle SQL condition for getMovieBlockCondition', () => {
      const cond = getMovieBlockCondition('pref-test-user');
      expect(cond).toBeDefined();
    });
  });

  describe('loggerMiddleware', () => {
    it('logs request method and path', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const app = new Hono();
      app.use('*', loggerMiddleware);
      app.get('/test-route', (c) => c.text('ok'));

      const res = await app.request('/test-route');
      expect(res.status).toBe(200);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('GET /test-route'));
      consoleSpy.mockRestore();
    });
  });
});
