import { Hono } from 'hono';
import { requireAuth, optionalAuth, requireRole, requireAdmin, requireModerator } from '../src/middleware/authMiddleware';
import { auth } from '../src/auth';
import type { AppEnv } from '../src/types';

describe('Auth & RBAC Middleware', () => {
  let app: Hono<AppEnv>;

  beforeEach(() => {
    app = new Hono<AppEnv>();
    app.get('/test/protected', requireAuth, (c) => c.json({ success: true, user: c.get('user') }));
    app.get('/test/optional', optionalAuth, (c) => c.json({ success: true, user: c.get('user') || null }));
    app.get('/test/admin', requireAdmin, (c) => c.json({ success: true, user: c.get('user') }));
    app.get('/test/moderator', requireModerator, (c) => c.json({ success: true, user: c.get('user') }));
    app.get('/test/custom-role', requireRole(['admin', 'moderator', 'custom' as any]), (c) => c.json({ success: true }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('requireAuth', () => {
    it('returns 401 when no session is present', async () => {
      jest.spyOn(auth.api, 'getSession').mockResolvedValue(null as any);

      const res = await app.request('/test/protected');
      expect(res.status).toBe(401);
      const data = (await res.json()) as any;
      expect(data).toEqual({ success: false, error: 'Unauthorized' });
    });

    it('returns 403 when user is banned', async () => {
      jest.spyOn(auth.api, 'getSession').mockResolvedValue({
        session: { id: 's1' },
        user: { id: 'u1', name: 'Banned User', banned: true, banReason: 'Spamming' }
      } as any);

      const res = await app.request('/test/protected');
      expect(res.status).toBe(403);
      const data = (await res.json()) as any;
      expect(data.error).toBe('Your account has been suspended');
      expect(data.banReason).toBe('Spamming');
    });

    it('allows access and attaches user to context when valid session', async () => {
      jest.spyOn(auth.api, 'getSession').mockResolvedValue({
        session: { id: 's1' },
        user: { id: 'u1', name: 'Valid User', role: 'user', banned: false }
      } as any);

      const res = await app.request('/test/protected');
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.user.id).toBe('u1');
    });

    it('returns 500 when an unexpected error occurs', async () => {
      jest.spyOn(auth.api, 'getSession').mockRejectedValue(new Error('DB failure'));

      const res = await app.request('/test/protected');
      expect(res.status).toBe(500);
      const data = (await res.json()) as any;
      expect(data.error).toBe('Internal Server Error');
    });
  });

  describe('optionalAuth', () => {
    it('allows unauthenticated requests without setting user', async () => {
      jest.spyOn(auth.api, 'getSession').mockResolvedValue(null as any);

      const res = await app.request('/test/optional');
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.user).toBeNull();
    });

    it('attaches user when session is valid and not banned', async () => {
      jest.spyOn(auth.api, 'getSession').mockResolvedValue({
        session: { id: 's1' },
        user: { id: 'u1', name: 'Normal User', role: 'user', banned: false }
      } as any);

      const res = await app.request('/test/optional');
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.user.id).toBe('u1');
    });

    it('does not attach banned user to context', async () => {
      jest.spyOn(auth.api, 'getSession').mockResolvedValue({
        session: { id: 's1' },
        user: { id: 'u1', name: 'Banned User', banned: true }
      } as any);

      const res = await app.request('/test/optional');
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.user).toBeNull();
    });
  });

  describe('requireRole / requireAdmin / requireModerator', () => {
    it('returns 401 when no session is found', async () => {
      jest.spyOn(auth.api, 'getSession').mockResolvedValue(null as any);

      const res = await app.request('/test/admin');
      expect(res.status).toBe(401);
      const data = (await res.json()) as any;
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 403 when user is banned', async () => {
      jest.spyOn(auth.api, 'getSession').mockResolvedValue({
        session: { id: 's1' },
        user: { id: 'u1', name: 'Banned Admin', role: 'admin', banned: true, banReason: 'Policy violation' }
      } as any);

      const res = await app.request('/test/admin');
      expect(res.status).toBe(403);
      const data = (await res.json()) as any;
      expect(data.error).toBe('Your account has been suspended');
      expect(data.banReason).toBe('Policy violation');
    });

    it('rejects regular user from admin route with 403', async () => {
      jest.spyOn(auth.api, 'getSession').mockResolvedValue({
        session: { id: 's1' },
        user: { id: 'u1', name: 'Regular User', role: 'user' }
      } as any);

      const res = await app.request('/test/admin');
      expect(res.status).toBe(403);
      const data = (await res.json()) as any;
      expect(data.error).toContain('insufficient permissions');
      expect(data.requiredRoles).toEqual(['admin']);
    });

    it('rejects regular user from moderator route with 403', async () => {
      jest.spyOn(auth.api, 'getSession').mockResolvedValue({
        session: { id: 's1' },
        user: { id: 'u1', name: 'Regular User', role: 'user' }
      } as any);

      const res = await app.request('/test/moderator');
      expect(res.status).toBe(403);
      const data = (await res.json()) as any;
      expect(data.error).toContain('insufficient permissions');
      expect(data.requiredRoles).toEqual(['admin', 'moderator']);
    });

    it('allows moderator on moderator route', async () => {
      jest.spyOn(auth.api, 'getSession').mockResolvedValue({
        session: { id: 's1' },
        user: { id: 'u2', name: 'Mod User', role: 'moderator' }
      } as any);

      const res = await app.request('/test/moderator');
      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data.success).toBe(true);
      expect(data.user.role).toBe('moderator');
    });

    it('rejects moderator from admin route with 403', async () => {
      jest.spyOn(auth.api, 'getSession').mockResolvedValue({
        session: { id: 's1' },
        user: { id: 'u2', name: 'Mod User', role: 'moderator' }
      } as any);

      const res = await app.request('/test/admin');
      expect(res.status).toBe(403);
      const data = (await res.json()) as any;
      expect(data.error).toContain('insufficient permissions');
    });

    it('allows admin on admin route and moderator route', async () => {
      jest.spyOn(auth.api, 'getSession').mockResolvedValue({
        session: { id: 's1' },
        user: { id: 'u3', name: 'Admin User', role: 'admin' }
      } as any);

      const resAdmin = await app.request('/test/admin');
      expect(resAdmin.status).toBe(200);

      const resMod = await app.request('/test/moderator');
      expect(resMod.status).toBe(200);
    });

    it('handles single role argument in requireRole', async () => {
      const singleRoleApp = new Hono<AppEnv>();
      singleRoleApp.get('/test/single', requireRole('moderator'), (c) => c.json({ success: true }));

      jest.spyOn(auth.api, 'getSession').mockResolvedValue({
        session: { id: 's1' },
        user: { id: 'u2', name: 'Mod User', role: 'moderator' }
      } as any);

      const res = await singleRoleApp.request('/test/single');
      expect(res.status).toBe(200);
    });
  });
});
