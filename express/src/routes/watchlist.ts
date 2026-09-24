// src/routes/watchlist.ts

import express, { Request, Response, Router } from "express";
import db from "../db";
import { resolveImage } from "../utils/imageUtils";
import type {
  WatchlistItem,
  AddToWatchlistRequest,
  UpdateWatchlistRequest,
  IdParam,
  MovieIdParam,
} from "shared-types";

// Need to declare a local type for ShowIdParam since it might not be in shared-types yet
interface ShowIdParam {
  showId: string;
}

const router: Router = express.Router();

// ── Prepared statements ───────────────────────────────────────────────────────

const insertMovieWatchlistStmt = db.prepare(`
  INSERT INTO watchlist (movie_id, status, user_rating, liked, review_text, watch_count, last_watched_at, source)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertShowWatchlistStmt = db.prepare(`
  INSERT INTO watchlist (show_id, status, user_rating, liked, review_text, watch_count, last_watched_at, source)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const selectAllWatchlistStmt = db.prepare(`
  SELECT id, movie_id, show_id, status, added_at, watched_at, notes,
         user_rating, liked, review_text, watch_count, last_watched_at, source
  FROM watchlist ORDER BY added_at DESC
`);

const selectWatchlistByIdStmt = db.prepare(`
  SELECT id, movie_id, show_id, status, added_at, watched_at, notes,
         user_rating, liked, review_text, watch_count, last_watched_at, source
  FROM watchlist WHERE id = ?
`);

const selectWatchlistByMovieIdStmt = db.prepare(`
  SELECT id, movie_id, show_id, status, added_at, watched_at, notes,
         user_rating, liked, review_text, watch_count, last_watched_at, source
  FROM watchlist WHERE movie_id = ?
`);

const selectWatchlistByShowIdStmt = db.prepare(`
  SELECT id, movie_id, show_id, status, added_at, watched_at, notes,
         user_rating, liked, review_text, watch_count, last_watched_at, source
  FROM watchlist WHERE show_id = ?
`);

const selectWatchlistByStatusStmt = db.prepare(`
  SELECT id, movie_id, show_id, status, added_at, watched_at, notes,
         user_rating, liked, review_text, watch_count, last_watched_at, source
  FROM watchlist WHERE status = ? ORDER BY added_at DESC
`);

const updateWatchlistStatusStmt = db.prepare(`
  UPDATE watchlist SET 
    status = ?, watched_at = ?, notes = ?, 
    user_rating = ?, liked = ?, review_text = ?, 
    watch_count = ?, last_watched_at = ?, source = ?,
    updated_at = datetime('now')
  WHERE id = ?
`);

const deleteWatchlistStmt = db.prepare(`
  DELETE FROM watchlist WHERE id = ?
`);

// ── Batch attach helper ───────────────────────────────────────────────────────

function attachMediaToWatchlistItems(
  items: WatchlistItem[],
): any[] {
  if (items.length === 0) return [];

  const movieIds = items.map((i) => i.movie_id).filter(Boolean) as number[];
  const showIds = items.map((i) => i.show_id).filter(Boolean) as number[];
  
  const movieMap = new Map<number, any>();
  const showMap = new Map<number, any>();

  // Fetch Movies
  if (movieIds.length > 0) {
    const ph = movieIds.map(() => "?").join(",");
    const movies = db.prepare(`SELECT * FROM movies WHERE id IN (${ph})`).all(...movieIds) as any[];
    
    const allLanguages = db.prepare(`
       SELECT ml.movie_id, l.id, l.name, l.code
       FROM languages l INNER JOIN movie_languages ml ON l.id = ml.language_id
       WHERE ml.movie_id IN (${ph})
    `).all(...movieIds) as any[];

    const allGenres = db.prepare(`
       SELECT mg.movie_id, g.id, g.name, g.slug
       FROM genres g INNER JOIN movie_genres mg ON g.id = mg.genre_id
       WHERE mg.movie_id IN (${ph})
    `).all(...movieIds) as any[];

    const languageMap = new Map<number, any[]>();
    allLanguages.forEach(({ movie_id, ...lang }) => {
      if (!languageMap.has(movie_id)) languageMap.set(movie_id, []);
      languageMap.get(movie_id)!.push(lang);
    });

    const genreMap = new Map<number, any[]>();
    allGenres.forEach(({ movie_id, ...genre }) => {
      if (!genreMap.has(movie_id)) genreMap.set(movie_id, []);
      genreMap.get(movie_id)!.push(genre);
    });

    movies.forEach(m => {
      movieMap.set(m.id, {
        id: m.id,
        uuid: m.uuid,
        type: 'movie',
        title: m.title,
        poster_url: resolveImage((m as any).tmdb_poster_path, (m as any).local_poster_url) || m.poster_url,
        backdrop_url: resolveImage((m as any).tmdb_backdrop_path, (m as any).local_backdrop_url, 'w780') || m.backdrop_url,
        release_year: m.release_year,
        runtime: m.runtime,
        rating_imdb: m.rating_imdb,
        age_rating: m.age_rating,
        status: m.status ?? "released",
        in_watchlist: true,
        languages: languageMap.get(m.id) ?? [],
        genres: genreMap.get(m.id) ?? [],
      });
    });
  }

  // Fetch Shows
  if (showIds.length > 0) {
    const ph = showIds.map(() => "?").join(",");
    const shows = db.prepare(`SELECT * FROM tv_shows WHERE id IN (${ph})`).all(...showIds) as any[];
    
    shows.forEach(s => {
      showMap.set(s.id, {
        id: s.id,
        uuid: s.uuid,
        type: 'tv',
        title: s.title,
        poster_url: resolveImage(s.tmdb_poster_path, null) || s.poster_url,
        backdrop_url: resolveImage(s.tmdb_backdrop_path, null, 'w780') || s.backdrop_url,
        first_air_date: s.first_air_date,
        network: s.network,
        status: s.status,
        in_watchlist: true,
      });
    });
  }

  return items.map((item) => {
    const formattedItem = { ...item, liked: !!item.liked };
    if (formattedItem.movie_id) {
      return { ...formattedItem, movie: movieMap.get(formattedItem.movie_id) };
    }
    if (formattedItem.show_id) {
      return { ...formattedItem, show: showMap.get(formattedItem.show_id) };
    }
    return formattedItem;
  });
}

// ── GET /watchlist/movie/:movieId ─────────────────────────────────────────────

router.get("/movie/:movieId", (req: Request<MovieIdParam>, res: Response) => {
  try {
    const movieId = parseInt(req.params.movieId as string);
    if (isNaN(movieId)) return res.status(400).json({ success: false, error: "Invalid movie ID" });

    const item = selectWatchlistByMovieIdStmt.get(movieId) as WatchlistItem | undefined;
    if (!item) return res.json({ success: true, data: null });

    const [populated] = attachMediaToWatchlistItems([item]);
    res.json({ success: true, data: populated });
  } catch (err: any) {
    console.error("Error checking watchlist:", err);
    res.status(500).json({ success: false, error: "Failed to check watchlist" });
  }
});

// ── GET /watchlist/show/:showId ─────────────────────────────────────────────

router.get("/show/:showId", (req: Request<ShowIdParam>, res: Response) => {
  try {
    const showId = parseInt(req.params.showId as string);
    if (isNaN(showId)) return res.status(400).json({ success: false, error: "Invalid show ID" });

    const item = selectWatchlistByShowIdStmt.get(showId) as WatchlistItem | undefined;
    if (!item) return res.json({ success: true, data: null });

    const [populated] = attachMediaToWatchlistItems([item]);
    res.json({ success: true, data: populated });
  } catch (err: any) {
    console.error("Error checking watchlist:", err);
    res.status(500).json({ success: false, error: "Failed to check watchlist" });
  }
});


// ── GET /watchlist ────────────────────────────────────────────────────────────

router.get("/", (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let items: WatchlistItem[];

    if (status && typeof status === "string") {
      const validStatuses = ["want_to_watch", "watching", "watched"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, error: `Invalid status` });
      }
      items = selectWatchlistByStatusStmt.all(status) as WatchlistItem[];
    } else {
      items = selectAllWatchlistStmt.all() as WatchlistItem[];
    }

    const populatedItems = attachMediaToWatchlistItems(items);

    const grouped = populatedItems.reduce((acc, item) => {
      if (!acc[item.status]) acc[item.status] = [];
      acc[item.status].push(item);
      return acc;
    }, {} as Record<string, any[]>);

    res.json({ success: true, data: { items: populatedItems, grouped } });
  } catch (err: any) {
    console.error("Error fetching watchlist:", err);
    res.status(500).json({ success: false, error: "Failed to fetch watchlist" });
  }
});

// ── GET /watchlist/:id ────────────────────────────────────────────────────────

router.get("/:id", (req: Request<IdParam>, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid watchlist ID" });

    const item = selectWatchlistByIdStmt.get(id) as WatchlistItem | undefined;
    if (!item) return res.status(404).json({ success: false, error: "Watchlist item not found" });

    const [populated] = attachMediaToWatchlistItems([item]);
    res.json({ success: true, data: populated });
  } catch (err: any) {
    console.error("Error fetching watchlist item:", err);
    res.status(500).json({ success: false, error: "Failed to fetch watchlist item" });
  }
});

// ── POST /watchlist ───────────────────────────────────────────────────────────

router.post("/", (req: Request, res: Response) => {
  try {
    const { 
      movie_id, show_id, status = "want_to_watch",
      user_rating = null, liked = 0, review_text = null,
      watch_count = 0, last_watched_at = null, source = 'manual'
    } = req.body as AddToWatchlistRequest;

    if (!movie_id && !show_id) {
      return res.status(400).json({ success: false, error: "movie_id or show_id is required" });
    }

    const validStatuses = ["want_to_watch", "watching", "watched"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status` });
    }

    let watchlistId;

    if (movie_id) {
      const exists = db.prepare(`SELECT id FROM movies WHERE id = ?`).get(movie_id);
      if (!exists) return res.status(404).json({ success: false, error: "Movie not found" });

      const existing = selectWatchlistByMovieIdStmt.get(movie_id) as WatchlistItem | undefined;
      if (existing) return res.status(409).json({ success: false, error: "Movie already in watchlist", existingItem: existing });

      const info = insertMovieWatchlistStmt.run(movie_id, status, user_rating, liked ? 1 : 0, review_text, watch_count, last_watched_at, source);
      watchlistId = info.lastInsertRowid;
    } else {
      const exists = db.prepare(`SELECT id FROM tv_shows WHERE id = ?`).get(show_id);
      if (!exists) return res.status(404).json({ success: false, error: "Show not found" });

      const existing = selectWatchlistByShowIdStmt.get(show_id) as WatchlistItem | undefined;
      if (existing) return res.status(409).json({ success: false, error: "Show already in watchlist", existingItem: existing });

      const info = insertShowWatchlistStmt.run(show_id, status, user_rating, liked ? 1 : 0, review_text, watch_count, last_watched_at, source);
      watchlistId = info.lastInsertRowid;
    }

    const item = selectWatchlistByIdStmt.get(watchlistId as number) as WatchlistItem;
    const [populated] = attachMediaToWatchlistItems([item]);

    res.status(201).json({ success: true, message: "Added to watchlist", data: populated });
  } catch (err: any) {
    console.error("Error adding to watchlist:", err);
    res.status(500).json({ success: false, error: "Failed to add to watchlist", message: err.message });
  }
});

// ── PATCH /watchlist/:id ──────────────────────────────────────────────────────

router.patch("/:id", (req: Request<IdParam>, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid watchlist ID" });

    const existing = selectWatchlistByIdStmt.get(id) as WatchlistItem | undefined;
    if (!existing) return res.status(404).json({ success: false, error: "Watchlist item not found" });

    const { status, notes, watched_at, user_rating, liked, review_text, watch_count, last_watched_at, source } = req.body as UpdateWatchlistRequest;

    if (status) {
      const validStatuses = ["want_to_watch", "watching", "watched"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, error: `Invalid status` });
      }
    }

    const newStatus = status ?? existing.status;
    const newNotes = notes ?? existing.notes ?? null;
    const newWatchedAt =
      watched_at !== undefined
        ? watched_at
        : newStatus === "watched" && !existing.watched_at
          ? new Date().toISOString()
          : (existing.watched_at ?? null);

    const newUserRating = user_rating !== undefined ? user_rating : existing.user_rating ?? null;
    const newLiked = liked !== undefined ? (liked ? 1 : 0) : existing.liked ?? 0;
    const newReviewText = review_text !== undefined ? review_text : existing.review_text ?? null;
    const newWatchCount = watch_count !== undefined ? watch_count : existing.watch_count ?? 0;
    const newLastWatchedAt = last_watched_at !== undefined ? last_watched_at : existing.last_watched_at ?? null;
    const newSource = source !== undefined ? source : existing.source ?? null;

    updateWatchlistStatusStmt.run(
      newStatus, newWatchedAt, newNotes, 
      newUserRating, newLiked, newReviewText, 
      newWatchCount, newLastWatchedAt, newSource, 
      id
    );

    const item = selectWatchlistByIdStmt.get(id) as WatchlistItem;
    const [populated] = attachMediaToWatchlistItems([item]);

    res.json({ success: true, message: "Watchlist item updated", data: populated });
  } catch (err: any) {
    console.error("Error updating watchlist:", err);
    res.status(500).json({ success: false, error: "Failed to update watchlist" });
  }
});

// ── DELETE /watchlist/:id ─────────────────────────────────────────────────────

router.delete("/:id", (req: Request<IdParam>, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid watchlist ID" });

    const item = selectWatchlistByIdStmt.get(id) as WatchlistItem | undefined;
    if (!item) return res.status(404).json({ success: false, error: "Watchlist item not found" });

    deleteWatchlistStmt.run(id);
    res.json({ success: true, message: "Removed from watchlist", data: { id: item.id } });
  } catch (err: any) {
    console.error("Error deleting from watchlist:", err);
    res.status(500).json({ success: false, error: "Failed to remove from watchlist" });
  }
});

export default router;
