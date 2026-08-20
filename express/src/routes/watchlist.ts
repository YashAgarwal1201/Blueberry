// src/routes/watchlist.ts

import express, { Request, Response, Router } from "express";
import db from "../db";
import type {
  WatchlistItem,
  WatchlistItemWithMovie,
  MovieWithDetails,
  Language,
  Genre,
  CastMember,
  MovieCompany,
  AddToWatchlistRequest,
  UpdateWatchlistRequest,
  IdParam,
  MovieIdParam,
} from "shared-types";

const router: Router = express.Router();

// ── Prepared statements ───────────────────────────────────────────────────────

const insertWatchlistStmt = db.prepare(`
  INSERT INTO watchlist (movie_id, status) VALUES (?, ?)
`);

const selectAllWatchlistStmt = db.prepare(`
  SELECT id, movie_id, status, added_at, watched_at, notes
  FROM watchlist ORDER BY added_at DESC
`);

const selectWatchlistByIdStmt = db.prepare(`
  SELECT id, movie_id, status, added_at, watched_at, notes
  FROM watchlist WHERE id = ?
`);

const selectWatchlistByMovieIdStmt = db.prepare(`
  SELECT id, movie_id, status, added_at, watched_at, notes
  FROM watchlist WHERE movie_id = ?
`);

const selectWatchlistByStatusStmt = db.prepare(`
  SELECT id, movie_id, status, added_at, watched_at, notes
  FROM watchlist WHERE status = ? ORDER BY added_at DESC
`);

const updateWatchlistStatusStmt = db.prepare(`
  UPDATE watchlist SET status = ?, watched_at = ?, notes = ? WHERE id = ?
`);

const deleteWatchlistStmt = db.prepare(`
  DELETE FROM watchlist WHERE id = ?
`);

const deleteWatchlistByMovieStmt = db.prepare(`
  DELETE FROM watchlist WHERE movie_id = ?
`);

// ── Batch attach helper ───────────────────────────────────────────────────────

function attachMoviesToWatchlistItems(
  items: WatchlistItem[],
): WatchlistItemWithMovie[] {
  if (items.length === 0) return [];

  const movieIds = items.map((i) => i.movie_id!).filter(Boolean);
  if (movieIds.length === 0) return [];
  const ph = movieIds.map(() => "?").join(",");

  const movies = db
    .prepare(`SELECT * FROM movies WHERE id IN (${ph})`)
    .all(...movieIds) as any[];

  const allLanguages = db
    .prepare(
      `SELECT ml.movie_id, l.id, l.name, l.code
       FROM languages l
       INNER JOIN movie_languages ml ON l.id = ml.language_id
       WHERE ml.movie_id IN (${ph})`,
    )
    .all(...movieIds) as Array<{ movie_id: number; id: number; name: string; code: string }>;

  const allGenres = db
    .prepare(
      `SELECT mg.movie_id, g.id, g.name, g.slug
       FROM genres g
       INNER JOIN movie_genres mg ON g.id = mg.genre_id
       WHERE mg.movie_id IN (${ph})`,
    )
    .all(...movieIds) as Array<{ movie_id: number; id: number; name: string; slug: string }>;

  const movieMap = new Map<number, any>();
  movies.forEach((m) => movieMap.set(m.id, m));

  const languageMap = new Map<number, { id: number; name: string; code: string }[]>();
  allLanguages.forEach(({ movie_id, ...lang }) => {
    if (!languageMap.has(movie_id)) languageMap.set(movie_id, []);
    languageMap.get(movie_id)!.push(lang);
  });

  const genreMap = new Map<number, { id: number; name: string; slug: string }[]>();
  allGenres.forEach(({ movie_id, ...genre }) => {
    if (!genreMap.has(movie_id)) genreMap.set(movie_id, []);
    genreMap.get(movie_id)!.push(genre);
  });

  return items.map((item) => {
    const m = movieMap.get(item.movie_id!)!;
    return {
      ...item,
      movie: {
        id: m.id,
        uuid: m.uuid,
        type: 'movie',
        title: m.title,
        poster_url: m.poster_url,
        backdrop_url: m.backdrop_url,
        release_year: m.release_year,
        runtime: m.runtime,
        rating_imdb: m.rating_imdb,
        age_rating: m.age_rating,
        status: m.status ?? "released",
        in_watchlist: true, // it is in watchlist!
        languages: languageMap.get(m.id) ?? [],
        genres: genreMap.get(m.id) ?? [],
      }
    } as unknown as WatchlistItemWithMovie;
  });
}

// ── GET /watchlist/movie/:movieId ─────────────────────────────────────────────
// Declared BEFORE /:id — prevents /movie/5 from matching /:id

router.get("/movie/:movieId", (req: Request<MovieIdParam>, res: Response) => {
  try {
    const movieId = parseInt(req.params.movieId as string);
    if (isNaN(movieId))
      return res
        .status(400)
        .json({ success: false, error: "Invalid movie ID" });

    const item = selectWatchlistByMovieIdStmt.get(movieId) as
      | WatchlistItem
      | undefined;
    if (!item)
      return res.json({ success: true, data: null });

    const [itemWithMovie] = attachMoviesToWatchlistItems([item]);
    res.json({ success: true, data: itemWithMovie });
  } catch (err: any) {
    console.error("Error checking watchlist:", err);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to check watchlist",
        message: err.message,
      });
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
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }
      items = selectWatchlistByStatusStmt.all(status) as WatchlistItem[];
    } else {
      items = selectAllWatchlistStmt.all() as WatchlistItem[];
    }

    const itemsWithMovies = attachMoviesToWatchlistItems(items);

    const grouped = itemsWithMovies.reduce(
      (acc, item) => {
        if (!acc[item.status]) acc[item.status] = [];
        acc[item.status].push(item);
        return acc;
      },
      {} as Record<string, WatchlistItemWithMovie[]>,
    );

    res.json({
      success: true,
      data: { items: itemsWithMovies, grouped },
    });
  } catch (err: any) {
    console.error("Error fetching watchlist:", err);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch watchlist",
        message: err.message,
      });
  }
});

// ── GET /watchlist/:id ────────────────────────────────────────────────────────

router.get("/:id", (req: Request<IdParam>, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, error: "Invalid watchlist ID" });

    const item = selectWatchlistByIdStmt.get(id) as WatchlistItem | undefined;
    if (!item)
      return res
        .status(404)
        .json({ success: false, error: "Watchlist item not found" });

    const [itemWithMovie] = attachMoviesToWatchlistItems([item]);
    res.json({ success: true, data: itemWithMovie });
  } catch (err: any) {
    console.error("Error fetching watchlist item:", err);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch watchlist item",
        message: err.message,
      });
  }
});

// ── POST /watchlist ───────────────────────────────────────────────────────────

router.post("/", (req: Request, res: Response) => {
  try {
    const {
      movie_id,
      status = "want_to_watch",
      notes,
    } = req.body as AddToWatchlistRequest;

    if (!movie_id)
      return res
        .status(400)
        .json({ success: false, error: "movie_id is required" });

    const validStatuses = ["want_to_watch", "watching", "watched"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const movieExists = db
      .prepare(`SELECT id FROM movies WHERE id = ?`)
      .get(movie_id);
    if (!movieExists)
      return res.status(404).json({ success: false, error: "Movie not found" });

    const existing = selectWatchlistByMovieIdStmt.get(movie_id) as
      | WatchlistItem
      | undefined;
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "Movie already in watchlist",
        existingItem: existing,
      });
    }

    const info = insertWatchlistStmt.run(movie_id, status);
    const watchlistId = info.lastInsertRowid as number;

    const item = selectWatchlistByIdStmt.get(watchlistId) as WatchlistItem;
    const [itemWithMovie] = attachMoviesToWatchlistItems([item]);

    res
      .status(201)
      .json({
        success: true,
        message: "Movie added to watchlist",
        data: itemWithMovie,
      });
  } catch (err: any) {
    console.error("Error adding to watchlist:", err);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to add to watchlist",
        message: err.message,
      });
  }
});

// ── PATCH /watchlist/:id ──────────────────────────────────────────────────────

router.patch("/:id", (req: Request<IdParam>, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, error: "Invalid watchlist ID" });

    const existing = selectWatchlistByIdStmt.get(id) as
      | WatchlistItem
      | undefined;
    if (!existing)
      return res
        .status(404)
        .json({ success: false, error: "Watchlist item not found" });

    const { status, notes, watched_at } = req.body as UpdateWatchlistRequest;

    if (!status && notes === undefined && watched_at === undefined)
      return res
        .status(400)
        .json({
          success: false,
          error: "Nothing to update — provide status, notes, or watched_at",
        });

    if (status) {
      const validStatuses = ["want_to_watch", "watching", "watched"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
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

    updateWatchlistStatusStmt.run(newStatus, newWatchedAt, newNotes, id);

    const item = selectWatchlistByIdStmt.get(id) as WatchlistItem;
    const [itemWithMovie] = attachMoviesToWatchlistItems([item]);

    res.json({
      success: true,
      message: "Watchlist item updated",
      data: itemWithMovie,
    });
  } catch (err: any) {
    console.error("Error updating watchlist:", err);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to update watchlist",
        message: err.message,
      });
  }
});

// ── DELETE /watchlist/:id ─────────────────────────────────────────────────────

router.delete("/:id", (req: Request<IdParam>, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, error: "Invalid watchlist ID" });

    const item = selectWatchlistByIdStmt.get(id) as WatchlistItem | undefined;
    if (!item)
      return res
        .status(404)
        .json({ success: false, error: "Watchlist item not found" });

    deleteWatchlistStmt.run(id);
    res.json({
      success: true,
      message: "Removed from watchlist",
      data: { id: item.id, movie_id: item.movie_id },
    });
  } catch (err: any) {
    console.error("Error deleting from watchlist:", err);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to remove from watchlist",
        message: err.message,
      });
  }
});

export default router;
