// backend/tests/feedRanking.test.ts
import db from "../src/db";
import {
  computeBayesianRating,
  computeHalfLifeDecay,
  computeCatalogFreshness,
  getTrendingMovies,
  getPopularMovies,
  getTrendingTV,
  getPopularTV,
  clearRankingCache,
  getRankingCacheSize,
  EVENT_WEIGHTS,
  MAX_USER_CONTRIBUTION,
} from "../src/services/feedRanking";

describe("BMCE Feed Ranking Service (Phase 2)", () => {
  beforeEach(() => {
    clearRankingCache();
    // Clean up test tables
    db.prepare("DELETE FROM media_events").run();
    db.prepare("DELETE FROM watchlist").run();
    db.prepare("DELETE FROM user_watched_episodes").run();
    db.prepare("DELETE FROM movie_genres").run();
    db.prepare("DELETE FROM movie_languages").run();
    db.prepare("DELETE FROM tv_genres").run();
    db.prepare("DELETE FROM tv_languages").run();
    db.prepare("DELETE FROM movies").run();
    db.prepare("DELETE FROM tv_shows").run();
  });

  afterAll(() => {
    clearRankingCache();
    db.prepare("DELETE FROM media_events").run();
    db.prepare("DELETE FROM watchlist").run();
    db.prepare("DELETE FROM user_watched_episodes").run();
    db.prepare("DELETE FROM movies").run();
    db.prepare("DELETE FROM tv_shows").run();
  });

  // ── 1. Pure Mathematical Formulas ──────────────────────────────────────────

  describe("Mathematical Formula Calculations", () => {
    describe("computeBayesianRating (WR)", () => {
      it("returns external IMDb rating when local votes = 0", () => {
        const wr = computeBayesianRating(0, null, 8.4);
        expect(wr).toBe(8.4);
      });

      it("defaults to 6.5 prior when both local votes and external rating are absent", () => {
        const wr = computeBayesianRating(0, null, null);
        expect(wr).toBe(6.5);
      });

      it("smoothly dampens a single 10/10 vote on an 8.0 IMDb title (m = 5)", () => {
        // (1 * 10 + 5 * 8.0) / (1 + 5) = 50 / 6 = 8.333
        const wr = computeBayesianRating(1, 10.0, 8.0, 5.0);
        expect(wr).toBeCloseTo(8.333, 2);
      });

      it("allows large community consensus to shift score toward local average", () => {
        // (20 * 9.5 + 5 * 8.0) / (20 + 5) = (190 + 40) / 25 = 230 / 25 = 9.20
        const wr = computeBayesianRating(20, 9.5, 8.0, 5.0);
        expect(wr).toBeCloseTo(9.20, 2);
      });
    });

    describe("computeHalfLifeDecay", () => {
      it("returns 1.0 (100%) for events occurring today (0 days elapsed)", () => {
        expect(computeHalfLifeDecay(0)).toBe(1.0);
        expect(computeHalfLifeDecay(-0.5)).toBe(1.0);
      });

      it("decays to exactly 50% at 4 days (half-life)", () => {
        expect(computeHalfLifeDecay(4.0)).toBeCloseTo(0.5, 4);
      });

      it("decays to 25% at 8 days (2 half-lives)", () => {
        expect(computeHalfLifeDecay(8.0)).toBeCloseTo(0.25, 4);
      });

      it("decays to 6.25% at 16 days (4 half-lives)", () => {
        expect(computeHalfLifeDecay(16.0)).toBeCloseTo(0.0625, 4);
      });

      it("prunes to 0.0 for events >= 30 days old", () => {
        expect(computeHalfLifeDecay(30.0)).toBe(0.0);
        expect(computeHalfLifeDecay(45.0)).toBe(0.0);
      });
    });

    describe("computeCatalogFreshness", () => {
      const CURRENT_YEAR = new Date().getFullYear();

      it("assigns maximum freshness to titles released in the current year", () => {
        // 10.0 * 1.0 * (8.5 / 10.0) = 8.5
        const freshness = computeCatalogFreshness(CURRENT_YEAR, 8.5, CURRENT_YEAR);
        expect(freshness).toBeCloseTo(8.5, 2);
      });

      it("halves freshness for titles released in the previous year", () => {
        // 10.0 * 0.5 * (8.5 / 10.0) = 4.25
        const freshness = computeCatalogFreshness(CURRENT_YEAR - 1, 8.5, CURRENT_YEAR);
        expect(freshness).toBeCloseTo(4.25, 2);
      });

      it("heavily decays freshness for older catalog titles", () => {
        const freshness = computeCatalogFreshness(CURRENT_YEAR - 15, 9.0, CURRENT_YEAR);
        expect(freshness).toBeLessThan(0.05);
      });
    });
  });

  // ── 2. Trending Movies Feed Ranking ────────────────────────────────────────

  describe("getTrendingMovies", () => {
    it("ranks newly released titles highest under Cold Start (zero user events)", async () => {
      const CURRENT_YEAR = new Date().getFullYear();

      // Movie 1: Released this year, high rating
      db.prepare(`
        INSERT INTO movies (id, uuid, title, release_year, rating_imdb, status)
        VALUES (1, 'm-1', 'Brand New Blockbuster', ?, 8.5, 'released')
      `).run(CURRENT_YEAR);

      // Movie 2: Released 10 years ago, high rating
      db.prepare(`
        INSERT INTO movies (id, uuid, title, release_year, rating_imdb, status)
        VALUES (2, 'm-2', 'Older Classic', ?, 9.0, 'released')
      `).run(CURRENT_YEAR - 10);

      const trending = await getTrendingMovies(10);
      expect(trending.length).toBe(2);
      expect(trending[0].id).toBe(1);
      expect(trending[1].id).toBe(2);
    });

    it("surges a movie to #1 when it receives recent high-velocity user activity", async () => {
      const CURRENT_YEAR = new Date().getFullYear();

      // Movie 1: New release without views
      db.prepare(`
        INSERT INTO movies (id, uuid, title, release_year, rating_imdb, status)
        VALUES (1, 'm-1', 'Quiet Release', ?, 7.0, 'released')
      `).run(CURRENT_YEAR);

      // Movie 2: Older catalog title, but with viral buzz today
      db.prepare(`
        INSERT INTO movies (id, uuid, title, release_year, rating_imdb, status)
        VALUES (2, 'm-2', 'Viral Resurgence', ?, 7.0, 'released')
      `).run(CURRENT_YEAR - 5);

      // 4 distinct anonymous devices play trailers and view Movie 2 today
      for (let i = 1; i <= 4; i++) {
        db.prepare(`
          INSERT INTO media_events (media_type, media_id, device_id, event_type, created_at)
          VALUES ('movie', 2, ?, 'trailer_play', datetime('now'))
        `).run(`device-${i}`);

        db.prepare(`
          INSERT INTO media_events (media_type, media_id, device_id, event_type, created_at)
          VALUES ('movie', 2, ?, 'page_view', datetime('now'))
        `).run(`device-${i}`);
      }

      const trending = await getTrendingMovies(10);
      expect(trending.length).toBe(2);
      expect(trending[0].id).toBe(2); // Movie 2 surges to #1
      expect(trending[1].id).toBe(1);
    });

    it("enforces anti-brigading saturation cap on a single user spamming events", async () => {
      const CURRENT_YEAR = new Date().getFullYear();

      // Movie 1: Spammed by a single bot (capped at MAX_USER_CONTRIBUTION = +15)
      db.prepare(`
        INSERT INTO movies (id, uuid, title, release_year, rating_imdb, status)
        VALUES (1, 'm-1', 'Target Movie', ?, 7.0, 'released')
      `).run(CURRENT_YEAR - 5);

      // Movie 2: Legitimate interest by 2 distinct users (+10 points each = +20 total > +15)
      db.prepare(`
        INSERT INTO movies (id, uuid, title, release_year, rating_imdb, status)
        VALUES (2, 'm-2', 'Legit Movie', ?, 7.0, 'released')
      `).run(CURRENT_YEAR - 5);

      // Single malicious bot inserts 50 trailer plays (+2.5 each = 125 raw points)
      for (let i = 0; i < 50; i++) {
        db.prepare(`
          INSERT INTO media_events (media_type, media_id, device_id, event_type, created_at)
          VALUES ('movie', 1, 'spammer-bot', 'trailer_play', datetime('now'))
        `).run();
      }

      // 2 legitimate devices interact with Movie 2 (4 trailer plays each = 10 pts each, total 20 pts)
      for (let i = 1; i <= 2; i++) {
        for (let j = 0; j < 4; j++) {
          db.prepare(`
            INSERT INTO media_events (media_type, media_id, device_id, event_type, created_at)
            VALUES ('movie', 2, ?, 'trailer_play', datetime('now'))
          `).run(`legit-device-${i}`);
        }
      }

      // Compute trending
      const trending = await getTrendingMovies(10);
      expect(trending.length).toBe(2);
      // Because spammer is capped at 15.0, Movie 2 with 20.0 points ranks #1!
      expect(trending[0].id).toBe(2);
      expect(trending[1].id).toBe(1);
    });

    it("dampens ranking for titles with low user ratings (negative intent)", async () => {
      const CURRENT_YEAR = new Date().getFullYear();

      // Movie 1: Fresh release with neutral activity
      db.prepare(`
        INSERT INTO movies (id, uuid, title, release_year, rating_imdb, status)
        VALUES (1, 'm-1', 'Average Film', ?, 6.5, 'released')
      `).run(CURRENT_YEAR);

      // Movie 2: Fresh release, but 5 users rated it 1/10 this week
      db.prepare(`
        INSERT INTO movies (id, uuid, title, release_year, rating_imdb, status)
        VALUES (2, 'm-2', 'Heavily Disliked Film', ?, 6.5, 'released')
      `).run(CURRENT_YEAR);

      // Insert dummy user records for foreign key constraint
      for (let i = 1; i <= 5; i++) {
        db.prepare(`
          INSERT OR IGNORE INTO "user" (id, name, email, emailVerified, createdAt, updatedAt)
          VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))
        `).run(`churn-user-${i}`, `User ${i}`, `churn${i}@test.com`);

        db.prepare(`
          INSERT INTO watchlist (user_id, movie_id, status, user_rating, added_at, updated_at)
          VALUES (?, 2, 'watched', 1, datetime('now'), datetime('now'))
        `).run(`churn-user-${i}`);
      }

      const trending = await getTrendingMovies(10);
      expect(trending.length).toBe(2);
      expect(trending[0].id).toBe(1); // Disliked film is pushed down
      expect(trending[1].id).toBe(2);
    });
  });

  // ── 3. Popular Movies Feed Ranking ─────────────────────────────────────────

  describe("getPopularMovies", () => {
    it("ranks titles with widespread likes and completions over low-engagement titles", async () => {
      // Movie 1: High engagement, 5 likes, 5 completed
      db.prepare(`
        INSERT INTO movies (id, uuid, title, release_year, rating_imdb, status)
        VALUES (1, 'm-pop-1', 'Beloved Classic', 2018, 8.8, 'released')
      `).run();

      // Movie 2: Low engagement
      db.prepare(`
        INSERT INTO movies (id, uuid, title, release_year, rating_imdb, status)
        VALUES (2, 'm-pop-2', 'Obscure Title', 2018, 7.0, 'released')
      `).run();

      for (let i = 1; i <= 5; i++) {
        db.prepare(`
          INSERT OR IGNORE INTO "user" (id, name, email, emailVerified, createdAt, updatedAt)
          VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))
        `).run(`pop-user-${i}`, `User ${i}`, `pop${i}@test.com`);

        db.prepare(`
          INSERT INTO watchlist (user_id, movie_id, status, liked, user_rating, added_at)
          VALUES (?, 1, 'watched', 1, 9, datetime('now', '-20 days'))
        `).run(`pop-user-${i}`);
      }

      const popular = await getPopularMovies(10);
      expect(popular.length).toBe(2);
      expect(popular[0].id).toBe(1);
      expect(popular[1].id).toBe(2);
    });
  });

  // ── 4. TV Feeds (Trending & Popular) ────────────────────────────────────────

  describe("TV Show Feeds", () => {
    it("computes Trending TV shows including episode watches", async () => {
      db.prepare(`
        INSERT INTO tv_shows (id, uuid, title, first_air_date, rating_imdb, status)
        VALUES (1, 'tv-1', 'Binge Worthy Series', '2026-01-15', 8.5, 'returning_series')
      `).run();

      db.prepare(`
        INSERT INTO tv_shows (id, uuid, title, first_air_date, rating_imdb, status)
        VALUES (2, 'tv-2', 'Quiet Series', '2026-01-15', 8.5, 'returning_series')
      `).run();

      // Insert dummy seasons and episodes
      db.prepare(`
        INSERT INTO tv_seasons (id, uuid, show_id, season_number, title)
        VALUES (10, 's-1', 1, 1, 'Season 1')
      `).run();

      db.prepare(`
        INSERT INTO tv_episodes (id, uuid, season_id, show_id, episode_number, title)
        VALUES (101, 'ep-1', 10, 1, 1, 'Pilot')
      `).run();

      // Log episode watches for Show 1
      for (let i = 1; i <= 4; i++) {
        db.prepare(`
          INSERT OR IGNORE INTO "user" (id, name, email, emailVerified, createdAt, updatedAt)
          VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))
        `).run(`binge-user-${i}`, `User ${i}`, `binge${i}@test.com`);

        db.prepare(`
          INSERT INTO user_watched_episodes (user_id, show_id, season_id, episode_id, season_number, episode_number, watched_at)
          VALUES (?, 1, 10, 101, 1, 1, datetime('now'))
        `).run(`binge-user-${i}`);
      }

      const trending = await getTrendingTV(10);
      expect(trending.length).toBe(2);
      expect(trending[0].id).toBe(1); // Show 1 ranks #1 due to episode watches
      expect(trending[1].id).toBe(2);
    });

    it("computes Popular TV shows based on Bayesian rating and watchlist commitments", async () => {
      db.prepare(`
        INSERT INTO tv_shows (id, uuid, title, first_air_date, rating_imdb, status)
        VALUES (1, 'tv-pop-1', 'Legendary Drama', '2015-05-01', 9.2, 'ended')
      `).run();

      db.prepare(`
        INSERT INTO tv_shows (id, uuid, title, first_air_date, rating_imdb, status)
        VALUES (2, 'tv-pop-2', 'Short Run Show', '2015-05-01', 7.1, 'ended')
      `).run();

      for (let i = 1; i <= 3; i++) {
        db.prepare(`
          INSERT OR IGNORE INTO "user" (id, name, email, emailVerified, createdAt, updatedAt)
          VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))
        `).run(`tv-pop-user-${i}`, `User ${i}`, `tvpop${i}@test.com`);

        db.prepare(`
          INSERT INTO watchlist (user_id, show_id, status, liked, user_rating, added_at)
          VALUES (?, 1, 'watched', 1, 10, datetime('now', '-40 days'))
        `).run(`tv-pop-user-${i}`);
      }

      const popular = await getPopularTV(10);
      expect(popular.length).toBe(2);
      expect(popular[0].id).toBe(1);
      expect(popular[1].id).toBe(2);
    });
  });

  // ── 5. Memoization Cache ───────────────────────────────────────────────────

  describe("60-Second Memoization Cache", () => {
    it("memoizes computed results in memory and clears via clearRankingCache", async () => {
      db.prepare(`
        INSERT INTO movies (id, uuid, title, release_year, rating_imdb, status)
        VALUES (1, 'm-cache-1', 'Cached Movie', 2026, 8.0, 'released')
      `).run();

      expect(getRankingCacheSize()).toBe(0);

      // First call -> Evaluates and caches
      const res1 = await getTrendingMovies(10);
      expect(res1.length).toBe(1);
      expect(getRankingCacheSize()).toBeGreaterThan(0);

      // Second call -> Serves from cache
      const res2 = await getTrendingMovies(10);
      expect(res2.length).toBe(1);
      expect(res2[0].id).toBe(1);

      // Clear cache
      clearRankingCache();
      expect(getRankingCacheSize()).toBe(0);
    });
  });
});
