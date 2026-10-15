import db, { watchlist as watchlistTable } from "../db";
import { isNotNull } from "drizzle-orm";

let cachedMovieWatchlist: { set: Set<number>; timestamp: number } | null = null;
let cachedShowWatchlist: { set: Set<number>; timestamp: number } | null = null;
const TTL_MS = 5000;

export function getMovieWatchlistSet(): Set<number> {
  const now = Date.now();
  if (cachedMovieWatchlist && now - cachedMovieWatchlist.timestamp < TTL_MS) {
    return cachedMovieWatchlist.set;
  }
  const rows = db
    .select({ movie_id: watchlistTable.movie_id })
    .from(watchlistTable)
    .where(isNotNull(watchlistTable.movie_id))
    .all();
  const set = new Set(rows.map((r) => r.movie_id).filter(Boolean) as number[]);
  cachedMovieWatchlist = { set, timestamp: now };
  return set;
}

export function getShowWatchlistSet(): Set<number> {
  const now = Date.now();
  if (cachedShowWatchlist && now - cachedShowWatchlist.timestamp < TTL_MS) {
    return cachedShowWatchlist.set;
  }
  const rows = db
    .select({ show_id: watchlistTable.show_id })
    .from(watchlistTable)
    .where(isNotNull(watchlistTable.show_id))
    .all();
  const set = new Set(rows.map((r) => r.show_id).filter(Boolean) as number[]);
  cachedShowWatchlist = { set, timestamp: now };
  return set;
}

export function invalidateWatchlistCache(): void {
  cachedMovieWatchlist = null;
  cachedShowWatchlist = null;
}
