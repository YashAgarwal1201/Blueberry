// src/services/feedRanking.ts
import db, {
  movies as moviesTable,
  tvShows as tvShowsTable,
  movieLanguages as movieLanguagesTable,
  movieGenres as movieGenresTable,
  tvGenres as tvGenresTable,
  languages as languagesTable,
  genres as genresTable,
} from "../db";
import { inArray, eq, type SQL } from "drizzle-orm";
import { resolveImage } from "../utils/imageUtils";
import { getMovieWatchlistSet, getShowWatchlistSet } from "../utils/watchlistCache";
import type { Movie, TVShow, MovieCard, TVShowCard } from "shared-types";

// ── Constants & Weights ───────────────────────────────────────────────────────

export const EVENT_WEIGHTS: Record<string, number> = {
  liked: 4.0,
  status_completed: 4.0,
  status_watching: 3.0,
  status_plan: 2.0,
  status_hold: 0.5,
  status_dropped: -3.0,
  trailer_play: 2.5,
  episode_watch: 1.5,
  search_click: 1.2,
  page_view: 0.5,
};

export const HALF_LIFE_DAYS = 4.0;
export const MAX_USER_CONTRIBUTION = 15.0; // Anti-brigading cap per 30d
export const BAYESIAN_PRIOR_WEIGHT = 5.0;
export const CACHE_TTL_MS = 60_000; // 60-second memoization cache

// ── In-Memory 60-Second Memoization Cache ─────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const rankingCache = new Map<string, CacheEntry<any>>();

export function clearRankingCache(): void {
  rankingCache.clear();
}

export function getRankingCacheSize(): number {
  return rankingCache.size;
}

// ── Mathematical Core Helpers ────────────────────────────────────────────────

/**
 * Continuous Exponential Half-Life Decay.
 * Decay(dt) = 2^(-dt / T_half)
 */
export function computeHalfLifeDecay(daysElapsed: number, tHalf = HALF_LIFE_DAYS): number {
  if (daysElapsed <= 0) return 1.0;
  if (daysElapsed >= 30.0) return 0.0;
  return Math.pow(2, -daysElapsed / tHalf);
}

/**
 * Bayesian Weighted Rating (WR).
 * Blends local user ratings with external catalog prior (IMDb) to prevent small sample distortion.
 * WR = (v * R + m * C) / (v + m)
 */
export function computeBayesianRating(
  vLocal: number,
  rLocalAvg: number | null,
  rExternal: number | null,
  m = BAYESIAN_PRIOR_WEIGHT,
): number {
  const priorC = rExternal ?? 6.5;
  if (vLocal <= 0 || rLocalAvg === null) {
    return priorC;
  }
  return (vLocal * rLocalAvg + m * priorC) / (vLocal + m);
}

/**
 * Catalog Freshness Baseline.
 * Guarantees fresh releases appear on Day 1 even before the first user event.
 */
export function computeCatalogFreshness(
  releaseYear: number | null,
  ratingImdb: number | null,
  currentYear: number = new Date().getFullYear(),
): number {
  const q = (ratingImdb ?? 6.5) / 10.0;
  if (!releaseYear) return 0.2 * q * 10.0;

  const age = Math.max(0, currentYear - releaseYear);
  let recencyFactor = 0;
  if (age === 0) {
    recencyFactor = 1.0;
  } else if (age === 1) {
    recencyFactor = 0.5;
  } else {
    recencyFactor = Math.max(0.0, 0.2 * Math.pow(2, -(age - 2)));
  }

  return 10.0 * recencyFactor * q;
}

// ── Card Selection Projections (Zero SELECT * Invariant) ──────────────────────

const movieCardSelection = {
  id: moviesTable.id,
  uuid: moviesTable.uuid,
  title: moviesTable.title,
  tagline: moviesTable.tagline,
  description: moviesTable.description,
  status: moviesTable.status,
  release_year: moviesTable.release_year,
  runtime: moviesTable.runtime,
  age_rating: moviesTable.age_rating,
  tmdb_id: moviesTable.tmdb_id,
  poster_url: moviesTable.poster_url,
  backdrop_url: moviesTable.backdrop_url,
  local_poster_url: moviesTable.local_poster_url,
  local_backdrop_url: moviesTable.local_backdrop_url,
  tmdb_poster_path: moviesTable.tmdb_poster_path,
  tmdb_backdrop_path: moviesTable.tmdb_backdrop_path,
  rating_imdb: moviesTable.rating_imdb,
};

const tvCardSelection = {
  id: tvShowsTable.id,
  uuid: tvShowsTable.uuid,
  title: tvShowsTable.title,
  status: tvShowsTable.status,
  first_air_date: tvShowsTable.first_air_date,
  poster_url: tvShowsTable.poster_url,
  backdrop_url: tvShowsTable.backdrop_url,
  tmdb_id: tvShowsTable.tmdb_id,
  tmdb_poster_path: tvShowsTable.tmdb_poster_path,
  tmdb_backdrop_path: tvShowsTable.tmdb_backdrop_path,
  description: tvShowsTable.description,
  tagline: tvShowsTable.tagline,
  rating_imdb: tvShowsTable.rating_imdb,
  episode_count: tvShowsTable.episode_count,
};

function projectMovieCards(movies: Movie[], watchlistSet: Set<number>): MovieCard[] {
  if (movies.length === 0) return [];
  const ids = movies.map((m) => m.id);

  const allLangs = db
    .select({
      movie_id: movieLanguagesTable.movie_id,
      id: languagesTable.id,
      name: languagesTable.name,
      code: languagesTable.code,
    })
    .from(languagesTable)
    .innerJoin(movieLanguagesTable, eq(languagesTable.id, movieLanguagesTable.language_id))
    .where(inArray(movieLanguagesTable.movie_id, ids))
    .all();

  const allGenres = db
    .select({
      movie_id: movieGenresTable.movie_id,
      id: genresTable.id,
      name: genresTable.name,
      slug: genresTable.slug,
    })
    .from(genresTable)
    .innerJoin(movieGenresTable, eq(genresTable.id, movieGenresTable.genre_id))
    .where(inArray(movieGenresTable.movie_id, ids))
    .all();

  const langMap = new Map<number, { id: number; name: string; code: string }[]>();
  const genreMap = new Map<number, { id: number; name: string; slug: string }[]>();

  allLangs.forEach(({ movie_id, ...l }) => {
    if (!langMap.has(movie_id)) langMap.set(movie_id, []);
    langMap.get(movie_id)!.push(l);
  });
  allGenres.forEach(({ movie_id, ...g }) => {
    if (!genreMap.has(movie_id)) genreMap.set(movie_id, []);
    genreMap.get(movie_id)!.push(g);
  });

  return movies.map((m) => ({
    id: m.id,
    uuid: m.uuid,
    type: "movie",
    title: m.title,
    poster_url: resolveImage(m.tmdb_poster_path, m.local_poster_url) || m.poster_url,
    backdrop_url: resolveImage(m.tmdb_backdrop_path, m.local_backdrop_url, "w780") || m.backdrop_url,
    release_year: m.release_year,
    runtime: m.runtime,
    rating_imdb: m.rating_imdb,
    age_rating: m.age_rating,
    status: m.status ?? "released",
    in_watchlist: watchlistSet.has(m.id),
    languages: langMap.get(m.id) ?? [],
    genres: genreMap.get(m.id) ?? [],
    description: m.description,
    tagline: m.tagline,
  }));
}

function projectTVCards(shows: TVShow[], watchlistSet: Set<number>): TVShowCard[] {
  if (shows.length === 0) return [];
  const ids = shows.map((s) => s.id);

  const allGenres = db
    .select({
      show_id: tvGenresTable.show_id,
      id: genresTable.id,
      name: genresTable.name,
      slug: genresTable.slug,
    })
    .from(genresTable)
    .innerJoin(tvGenresTable, eq(genresTable.id, tvGenresTable.genre_id))
    .where(inArray(tvGenresTable.show_id, ids))
    .all();

  const genreMap = new Map<number, { id: number; name: string; slug: string }[]>();
  allGenres.forEach(({ show_id, ...g }) => {
    if (!genreMap.has(show_id)) genreMap.set(show_id, []);
    genreMap.get(show_id)!.push(g);
  });

  return shows.map((s) => ({
    id: s.id,
    uuid: s.uuid,
    type: "tv",
    title: s.title,
    poster_url: resolveImage(s.tmdb_poster_path, null) || s.poster_url,
    backdrop_url: resolveImage(s.tmdb_backdrop_path, null, "w780") || s.backdrop_url,
    release_year: s.first_air_date ? parseInt(s.first_air_date.substring(0, 4)) : undefined,
    status: s.status ?? "returning_series",
    tmdb_id: s.tmdb_id,
    in_watchlist: watchlistSet.has(s.id),
    genres: genreMap.get(s.id) ?? [],
    description: s.description,
    tagline: s.tagline,
  }));
}

// ── Feed Ranking Services ────────────────────────────────────────────────────

/**
 * Computes Trending Movies using Exponential Half-Life Velocity with anti-brigading capping
 * and 60-second in-memory memoization.
 */
export async function getTrendingMovies(
  limit = 20,
  blockCond?: SQL,
  userId?: string,
): Promise<MovieCard[]> {
  const cacheKey = `trending:movie:${limit}:${blockCond ? "blocked" : "all"}`;
  const now = Date.now();
  const cached = rankingCache.get(cacheKey);

  let rawMovies: Movie[];

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    rawMovies = cached.data;
  } else {
    // 1. Ingest events within last 30 days
    const events = db
      .prepare(
        `SELECT 
           media_id,
           COALESCE(user_id, device_id, 'anon') as actor_id,
           event_type,
           CAST((julianday('now') - julianday(created_at)) AS REAL) as days_ago
         FROM media_events
         WHERE media_type = 'movie' 
           AND created_at >= datetime('now', '-30 days')`,
      )
      .all() as { media_id: number; actor_id: string; event_type: string; days_ago: number }[];

    // 2. Ingest recent watchlist mutations within last 30 days
    const watchlist = db
      .prepare(
        `SELECT 
           movie_id,
           user_id as actor_id,
           status,
           liked,
           user_rating,
           CAST((julianday('now') - julianday(COALESCE(updated_at, added_at))) AS REAL) as days_ago
         FROM watchlist
         WHERE movie_id IS NOT NULL
           AND (added_at >= datetime('now', '-30 days') OR updated_at >= datetime('now', '-30 days'))`,
      )
      .all() as {
      movie_id: number;
      actor_id: string;
      status: string;
      liked: number;
      user_rating: number | null;
      days_ago: number;
    }[];

    // 3. Aggregate per-movie and per-actor scores
    const movieActorsMap = new Map<number, Map<string, number>>();

    const addActorPoints = (mediaId: number, actorId: string, points: number) => {
      if (!movieActorsMap.has(mediaId)) movieActorsMap.set(mediaId, new Map());
      const actors = movieActorsMap.get(mediaId)!;
      actors.set(actorId, (actors.get(actorId) || 0) + points);
    };

    for (const ev of events) {
      const weight = EVENT_WEIGHTS[ev.event_type] ?? 0.5;
      const decay = computeHalfLifeDecay(ev.days_ago);
      addActorPoints(ev.media_id, ev.actor_id, weight * decay);
    }

    for (const wl of watchlist) {
      const decay = computeHalfLifeDecay(wl.days_ago);
      let statusWeight = 0;
      if (wl.status === "completed" || wl.status === "watched") statusWeight = EVENT_WEIGHTS.status_completed;
      else if (wl.status === "watching") statusWeight = EVENT_WEIGHTS.status_watching;
      else if (wl.status === "want_to_watch" || wl.status === "plan_to_watch")
        statusWeight = EVENT_WEIGHTS.status_plan;
      else if (wl.status === "on_hold") statusWeight = EVENT_WEIGHTS.status_hold;
      else if (wl.status === "dropped") statusWeight = EVENT_WEIGHTS.status_dropped;

      if (statusWeight !== 0) {
        addActorPoints(wl.movie_id, wl.actor_id, statusWeight * decay);
      }
      if (wl.liked === 1) {
        addActorPoints(wl.movie_id, wl.actor_id, EVENT_WEIGHTS.liked * decay);
      }
      if (wl.user_rating !== null) {
        const ratingPoints = (wl.user_rating - 5.0) * 1.5;
        addActorPoints(wl.movie_id, wl.actor_id, ratingPoints * decay);
      }
    }

    // 4. Calculate S_recent with anti-brigading saturation cap
    const sRecentMap = new Map<number, number>();
    for (const [mediaId, actors] of movieActorsMap.entries()) {
      let totalRecent = 0;
      for (const rawActorScore of actors.values()) {
        const capped = Math.sign(rawActorScore) * Math.min(Math.abs(rawActorScore), MAX_USER_CONTRIBUTION);
        totalRecent += capped;
      }
      sRecentMap.set(mediaId, totalRecent);
    }

    // 5. Query candidate movies with block condition
    let query = db
      .select({
        id: moviesTable.id,
        release_year: moviesTable.release_year,
        rating_imdb: moviesTable.rating_imdb,
      })
      .from(moviesTable)
      .$dynamic();

    if (blockCond) {
      query = query.where(blockCond);
    }

    const candidates = query.all();

    // 6. Blend S_recent + Catalog Freshness
    const scoreMap = new Map<number, number>();
    for (const c of candidates) {
      const recent = sRecentMap.get(c.id) || 0;
      const freshness = computeCatalogFreshness(c.release_year, c.rating_imdb);
      scoreMap.set(c.id, Math.max(0, recent + freshness));
    }

    // Sort descending by score
    candidates.sort((a, b) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0));
    const topIds = candidates.slice(0, limit).map((c) => c.id);

    if (topIds.length === 0) {
      rawMovies = [];
    } else {
      const fetched = db
        .select(movieCardSelection)
        .from(moviesTable)
        .where(inArray(moviesTable.id, topIds))
        .all() as unknown as Movie[];

      // Preserve exact ranked order
      const fetchedMap = new Map(fetched.map((m) => [m.id, m]));
      rawMovies = topIds.map((id) => fetchedMap.get(id)).filter(Boolean) as Movie[];
    }

    rankingCache.set(cacheKey, { data: rawMovies, timestamp: now });
  }

  // Attach dynamic in_watchlist flag for requesting user
  const watchlistSet = getMovieWatchlistSet(userId);
  return projectMovieCards(rawMovies, watchlistSet);
}

/**
 * Computes Popular Movies using Bayesian Weighted Ratings and Log-Dampened Engagement
 * with 60-second in-memory memoization.
 */
export async function getPopularMovies(
  limit = 20,
  blockCond?: SQL,
  userId?: string,
): Promise<MovieCard[]> {
  const cacheKey = `popular:movie:${limit}:${blockCond ? "blocked" : "all"}`;
  const now = Date.now();
  const cached = rankingCache.get(cacheKey);

  let rawMovies: Movie[];

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    rawMovies = cached.data;
  } else {
    // 1. Grouped watchlist aggregations
    const statsRows = db
      .prepare(
        `SELECT 
           movie_id,
           COUNT(CASE WHEN liked = 1 THEN 1 END) as like_count,
           COUNT(CASE WHEN status IN ('completed', 'watched') THEN 1 END) as completed_count,
           COUNT(CASE WHEN status = 'watching' THEN 1 END) as watching_count,
           COUNT(CASE WHEN status IN ('want_to_watch', 'plan_to_watch') THEN 1 END) as plan_count,
           COUNT(CASE WHEN status = 'dropped' THEN 1 END) as dropped_count,
           AVG(user_rating) as avg_rating,
           COUNT(user_rating) as rating_count
         FROM watchlist
         WHERE movie_id IS NOT NULL
         GROUP BY movie_id`,
      )
      .all() as {
      movie_id: number;
      like_count: number;
      completed_count: number;
      watching_count: number;
      plan_count: number;
      dropped_count: number;
      avg_rating: number | null;
      rating_count: number;
    }[];

    const statsMap = new Map(statsRows.map((s) => [s.movie_id, s]));

    // 2. Grouped unique views aggregations
    const viewsRows = db
      .prepare(
        `SELECT 
           media_id,
           COUNT(DISTINCT COALESCE(user_id, device_id)) as unique_views
         FROM media_events
         WHERE media_type = 'movie' AND event_type = 'page_view'
         GROUP BY media_id`,
      )
      .all() as { media_id: number; unique_views: number }[];

    const viewsMap = new Map(viewsRows.map((v) => [v.media_id, v.unique_views]));

    // 3. Query candidate movies
    let query = db
      .select({
        id: moviesTable.id,
        rating_imdb: moviesTable.rating_imdb,
      })
      .from(moviesTable)
      .$dynamic();

    if (blockCond) {
      query = query.where(blockCond);
    }

    const candidates = query.all();

    // 4. Compute Popularity Score
    const scoreMap = new Map<number, number>();
    for (const c of candidates) {
      const stats = statsMap.get(c.id);
      const uniqueViews = viewsMap.get(c.id) || 0;

      const wr = computeBayesianRating(
        stats?.rating_count || 0,
        stats?.avg_rating ?? null,
        c.rating_imdb,
        BAYESIAN_PRIOR_WEIGHT,
      );
      const sRating = 5.0 * wr;

      const sCommitment = Math.max(
        0,
        6.0 * (stats?.like_count || 0) +
          5.0 * (stats?.completed_count || 0) +
          3.0 * (stats?.watching_count || 0) +
          2.0 * (stats?.plan_count || 0) -
          4.0 * (stats?.dropped_count || 0),
      );

      const sTraffic = 4.0 * Math.log(1 + uniqueViews);

      scoreMap.set(c.id, sRating + sCommitment + sTraffic);
    }

    // Sort descending by score
    candidates.sort((a, b) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0));
    const topIds = candidates.slice(0, limit).map((c) => c.id);

    if (topIds.length === 0) {
      rawMovies = [];
    } else {
      const fetched = db
        .select(movieCardSelection)
        .from(moviesTable)
        .where(inArray(moviesTable.id, topIds))
        .all() as unknown as Movie[];

      const fetchedMap = new Map(fetched.map((m) => [m.id, m]));
      rawMovies = topIds.map((id) => fetchedMap.get(id)).filter(Boolean) as Movie[];
    }

    rankingCache.set(cacheKey, { data: rawMovies, timestamp: now });
  }

  const watchlistSet = getMovieWatchlistSet(userId);
  return projectMovieCards(rawMovies, watchlistSet);
}

/**
 * Computes Trending TV Shows using Exponential Half-Life Velocity with anti-brigading capping
 * and 60-second in-memory memoization.
 */
export async function getTrendingTV(
  limit = 20,
  blockCond?: SQL,
  userId?: string,
): Promise<TVShowCard[]> {
  const cacheKey = `trending:tv:${limit}:${blockCond ? "blocked" : "all"}`;
  const now = Date.now();
  const cached = rankingCache.get(cacheKey);

  let rawShows: TVShow[];

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    rawShows = cached.data;
  } else {
    // 1. Events from media_events
    const events = db
      .prepare(
        `SELECT 
           media_id,
           COALESCE(user_id, device_id, 'anon') as actor_id,
           event_type,
           CAST((julianday('now') - julianday(created_at)) AS REAL) as days_ago
         FROM media_events
         WHERE media_type = 'tv' 
           AND created_at >= datetime('now', '-30 days')`,
      )
      .all() as { media_id: number; actor_id: string; event_type: string; days_ago: number }[];

    // 2. Recent watchlist mutations
    const watchlist = db
      .prepare(
        `SELECT 
           show_id,
           user_id as actor_id,
           status,
           liked,
           user_rating,
           CAST((julianday('now') - julianday(COALESCE(updated_at, added_at))) AS REAL) as days_ago
         FROM watchlist
         WHERE show_id IS NOT NULL
           AND (added_at >= datetime('now', '-30 days') OR updated_at >= datetime('now', '-30 days'))`,
      )
      .all() as {
      show_id: number;
      actor_id: string;
      status: string;
      liked: number;
      user_rating: number | null;
      days_ago: number;
    }[];

    // 3. Recent episode watches
    const episodes = db
      .prepare(
        `SELECT 
           show_id,
           user_id as actor_id,
           CAST((julianday('now') - julianday(watched_at)) AS REAL) as days_ago
         FROM user_watched_episodes
         WHERE watched_at >= datetime('now', '-30 days')`,
      )
      .all() as { show_id: number; actor_id: string; days_ago: number }[];

    const showActorsMap = new Map<number, Map<string, number>>();

    const addActorPoints = (showId: number, actorId: string, points: number) => {
      if (!showActorsMap.has(showId)) showActorsMap.set(showId, new Map());
      const actors = showActorsMap.get(showId)!;
      actors.set(actorId, (actors.get(actorId) || 0) + points);
    };

    for (const ev of events) {
      const weight = EVENT_WEIGHTS[ev.event_type] ?? 0.5;
      const decay = computeHalfLifeDecay(ev.days_ago);
      addActorPoints(ev.media_id, ev.actor_id, weight * decay);
    }

    for (const wl of watchlist) {
      const decay = computeHalfLifeDecay(wl.days_ago);
      let statusWeight = 0;
      if (wl.status === "completed" || wl.status === "watched") statusWeight = EVENT_WEIGHTS.status_completed;
      else if (wl.status === "watching") statusWeight = EVENT_WEIGHTS.status_watching;
      else if (wl.status === "want_to_watch" || wl.status === "plan_to_watch")
        statusWeight = EVENT_WEIGHTS.status_plan;
      else if (wl.status === "on_hold") statusWeight = EVENT_WEIGHTS.status_hold;
      else if (wl.status === "dropped") statusWeight = EVENT_WEIGHTS.status_dropped;

      if (statusWeight !== 0) {
        addActorPoints(wl.show_id, wl.actor_id, statusWeight * decay);
      }
      if (wl.liked === 1) {
        addActorPoints(wl.show_id, wl.actor_id, EVENT_WEIGHTS.liked * decay);
      }
      if (wl.user_rating !== null) {
        const ratingPoints = (wl.user_rating - 5.0) * 1.5;
        addActorPoints(wl.show_id, wl.actor_id, ratingPoints * decay);
      }
    }

    for (const ep of episodes) {
      const decay = computeHalfLifeDecay(ep.days_ago);
      addActorPoints(ep.show_id, ep.actor_id, EVENT_WEIGHTS.episode_watch * decay);
    }

    // 4. Calculate S_recent with anti-brigading cap
    const sRecentMap = new Map<number, number>();
    for (const [showId, actors] of showActorsMap.entries()) {
      let totalRecent = 0;
      for (const rawActorScore of actors.values()) {
        const capped = Math.sign(rawActorScore) * Math.min(Math.abs(rawActorScore), MAX_USER_CONTRIBUTION);
        totalRecent += capped;
      }
      sRecentMap.set(showId, totalRecent);
    }

    // 5. Query candidate TV shows
    let query = db
      .select({
        id: tvShowsTable.id,
        first_air_date: tvShowsTable.first_air_date,
        rating_imdb: tvShowsTable.rating_imdb,
      })
      .from(tvShowsTable)
      .$dynamic();

    if (blockCond) {
      query = query.where(blockCond);
    }

    const candidates = query.all();

    // 6. Blend S_recent + Freshness
    const scoreMap = new Map<number, number>();
    for (const c of candidates) {
      const recent = sRecentMap.get(c.id) || 0;
      const releaseYear = c.first_air_date ? parseInt(c.first_air_date.substring(0, 4)) : null;
      const freshness = computeCatalogFreshness(releaseYear, c.rating_imdb);
      scoreMap.set(c.id, Math.max(0, recent + freshness));
    }

    candidates.sort((a, b) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0));
    const topIds = candidates.slice(0, limit).map((c) => c.id);

    if (topIds.length === 0) {
      rawShows = [];
    } else {
      const fetched = db
        .select(tvCardSelection)
        .from(tvShowsTable)
        .where(inArray(tvShowsTable.id, topIds))
        .all() as unknown as TVShow[];

      const fetchedMap = new Map(fetched.map((s) => [s.id, s]));
      rawShows = topIds.map((id) => fetchedMap.get(id)).filter(Boolean) as TVShow[];
    }

    rankingCache.set(cacheKey, { data: rawShows, timestamp: now });
  }

  const watchlistSet = getShowWatchlistSet(userId);
  return projectTVCards(rawShows, watchlistSet);
}

/**
 * Computes Popular TV Shows using Bayesian Weighted Ratings and Log-Dampened Engagement
 * with 60-second in-memory memoization.
 */
export async function getPopularTV(
  limit = 20,
  blockCond?: SQL,
  userId?: string,
): Promise<TVShowCard[]> {
  const cacheKey = `popular:tv:${limit}:${blockCond ? "blocked" : "all"}`;
  const now = Date.now();
  const cached = rankingCache.get(cacheKey);

  let rawShows: TVShow[];

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    rawShows = cached.data;
  } else {
    // 1. Grouped watchlist aggregations
    const statsRows = db
      .prepare(
        `SELECT 
           show_id,
           COUNT(CASE WHEN liked = 1 THEN 1 END) as like_count,
           COUNT(CASE WHEN status IN ('completed', 'watched') THEN 1 END) as completed_count,
           COUNT(CASE WHEN status = 'watching' THEN 1 END) as watching_count,
           COUNT(CASE WHEN status IN ('want_to_watch', 'plan_to_watch') THEN 1 END) as plan_count,
           COUNT(CASE WHEN status = 'dropped' THEN 1 END) as dropped_count,
           AVG(user_rating) as avg_rating,
           COUNT(user_rating) as rating_count
         FROM watchlist
         WHERE show_id IS NOT NULL
         GROUP BY show_id`,
      )
      .all() as {
      show_id: number;
      like_count: number;
      completed_count: number;
      watching_count: number;
      plan_count: number;
      dropped_count: number;
      avg_rating: number | null;
      rating_count: number;
    }[];

    const statsMap = new Map(statsRows.map((s) => [s.show_id, s]));

    // 2. Grouped unique views aggregations
    const viewsRows = db
      .prepare(
        `SELECT 
           media_id,
           COUNT(DISTINCT COALESCE(user_id, device_id)) as unique_views
         FROM media_events
         WHERE media_type = 'tv' AND event_type = 'page_view'
         GROUP BY media_id`,
      )
      .all() as { media_id: number; unique_views: number }[];

    const viewsMap = new Map(viewsRows.map((v) => [v.media_id, v.unique_views]));

    // 3. Query candidate shows
    let query = db
      .select({
        id: tvShowsTable.id,
        rating_imdb: tvShowsTable.rating_imdb,
      })
      .from(tvShowsTable)
      .$dynamic();

    if (blockCond) {
      query = query.where(blockCond);
    }

    const candidates = query.all();

    // 4. Compute Popularity Score
    const scoreMap = new Map<number, number>();
    for (const c of candidates) {
      const stats = statsMap.get(c.id);
      const uniqueViews = viewsMap.get(c.id) || 0;

      const wr = computeBayesianRating(
        stats?.rating_count || 0,
        stats?.avg_rating ?? null,
        c.rating_imdb,
        BAYESIAN_PRIOR_WEIGHT,
      );
      const sRating = 5.0 * wr;

      const sCommitment = Math.max(
        0,
        6.0 * (stats?.like_count || 0) +
          5.0 * (stats?.completed_count || 0) +
          3.0 * (stats?.watching_count || 0) +
          2.0 * (stats?.plan_count || 0) -
          4.0 * (stats?.dropped_count || 0),
      );

      const sTraffic = 4.0 * Math.log(1 + uniqueViews);

      scoreMap.set(c.id, sRating + sCommitment + sTraffic);
    }

    candidates.sort((a, b) => (scoreMap.get(b.id) || 0) - (scoreMap.get(a.id) || 0));
    const topIds = candidates.slice(0, limit).map((c) => c.id);

    if (topIds.length === 0) {
      rawShows = [];
    } else {
      const fetched = db
        .select(tvCardSelection)
        .from(tvShowsTable)
        .where(inArray(tvShowsTable.id, topIds))
        .all() as unknown as TVShow[];

      const fetchedMap = new Map(fetched.map((s) => [s.id, s]));
      rawShows = topIds.map((id) => fetchedMap.get(id)).filter(Boolean) as TVShow[];
    }

    rankingCache.set(cacheKey, { data: rawShows, timestamp: now });
  }

  const watchlistSet = getShowWatchlistSet(userId);
  return projectTVCards(rawShows, watchlistSet);
}
