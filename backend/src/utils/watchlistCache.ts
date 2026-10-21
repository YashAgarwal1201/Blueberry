import db, { watchlist as watchlistTable } from "../db";
import { and, eq, isNotNull } from "drizzle-orm";

interface CacheEntry {
  set: Set<number>;
  timestamp: number;
}

const movieCache = new Map<string, CacheEntry>();
const showCache = new Map<string, CacheEntry>();
const TTL_MS = 5000;
const EMPTY_SET = new Set<number>();

export function getMovieWatchlistSet(userId?: string): Set<number> {
  if (!userId) return EMPTY_SET;
  const now = Date.now();
  const cached = movieCache.get(userId);
  if (cached && now - cached.timestamp < TTL_MS) {
    return cached.set;
  }
  const rows = db
    .select({ movie_id: watchlistTable.movie_id })
    .from(watchlistTable)
    .where(
      and(
        eq(watchlistTable.user_id, userId),
        isNotNull(watchlistTable.movie_id),
      ),
    )
    .all();
  const set = new Set(rows.map((r) => r.movie_id).filter(Boolean) as number[]);
  movieCache.set(userId, { set, timestamp: now });
  return set;
}

export function getShowWatchlistSet(userId?: string): Set<number> {
  if (!userId) return EMPTY_SET;
  const now = Date.now();
  const cached = showCache.get(userId);
  if (cached && now - cached.timestamp < TTL_MS) {
    return cached.set;
  }
  const rows = db
    .select({ show_id: watchlistTable.show_id })
    .from(watchlistTable)
    .where(
      and(
        eq(watchlistTable.user_id, userId),
        isNotNull(watchlistTable.show_id),
      ),
    )
    .all();
  const set = new Set(rows.map((r) => r.show_id).filter(Boolean) as number[]);
  showCache.set(userId, { set, timestamp: now });
  return set;
}

export function invalidateWatchlistCache(userId?: string): void {
  if (userId) {
    movieCache.delete(userId);
    showCache.delete(userId);
  } else {
    movieCache.clear();
    showCache.clear();
  }
}
