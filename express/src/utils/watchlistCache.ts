import db from "../db";

let cachedMovieWatchlist: { set: Set<number>; timestamp: number } | null = null;
let cachedShowWatchlist: { set: Set<number>; timestamp: number } | null = null;
const TTL_MS = 5000;

export function getMovieWatchlistSet(): Set<number> {
  const now = Date.now();
  if (cachedMovieWatchlist && now - cachedMovieWatchlist.timestamp < TTL_MS) {
    return cachedMovieWatchlist.set;
  }
  const rows = db.prepare(`SELECT movie_id FROM watchlist WHERE movie_id IS NOT NULL`).all() as {
    movie_id: number;
  }[];
  const set = new Set(rows.map((r) => r.movie_id));
  cachedMovieWatchlist = { set, timestamp: now };
  return set;
}

export function getShowWatchlistSet(): Set<number> {
  const now = Date.now();
  if (cachedShowWatchlist && now - cachedShowWatchlist.timestamp < TTL_MS) {
    return cachedShowWatchlist.set;
  }
  const rows = db.prepare(`SELECT show_id FROM watchlist WHERE show_id IS NOT NULL`).all() as {
    show_id: number;
  }[];
  const set = new Set(rows.map((r) => r.show_id));
  cachedShowWatchlist = { set, timestamp: now };
  return set;
}

export function invalidateWatchlistCache(): void {
  cachedMovieWatchlist = null;
  cachedShowWatchlist = null;
}
