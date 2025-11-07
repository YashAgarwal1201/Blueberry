// src/routes/watchlist.ts

import express, { Request, Response, Router } from "express";
import db from "../db";
import {
  WatchlistItem,
  WatchlistItemWithMovie,
  Movie,
  Language,
  AddToWatchlistRequest,
  UpdateWatchlistRequest,
} from "../types.ts";

const router: Router = express.Router();

// Prepared statements
const insertWatchlistStmt = db.prepare(`
  INSERT INTO watchlist (movie_id, status)
  VALUES (?, ?)
`);

const selectAllWatchlistStmt = db.prepare(`
  SELECT id, movie_id, status, added_at, watched_at
  FROM watchlist
  ORDER BY added_at DESC
`);

const selectWatchlistByIdStmt = db.prepare(`
  SELECT id, movie_id, status, added_at, watched_at
  FROM watchlist
  WHERE id = ?
`);

const selectWatchlistByMovieIdStmt = db.prepare(`
  SELECT id, movie_id, status, added_at, watched_at
  FROM watchlist
  WHERE movie_id = ?
`);

const selectWatchlistByStatusStmt = db.prepare(`
  SELECT id, movie_id, status, added_at, watched_at
  FROM watchlist
  WHERE status = ?
  ORDER BY added_at DESC
`);

const updateWatchlistStatusStmt = db.prepare(`
  UPDATE watchlist
  SET status = ?, watched_at = ?
  WHERE id = ?
`);

const deleteWatchlistStmt = db.prepare(`
  DELETE FROM watchlist WHERE id = ?
`);

const deleteWatchlistByMovieStmt = db.prepare(`
  DELETE FROM watchlist WHERE movie_id = ?
`);

// Fetch movie details with languages for a single watchlist item
function attachMovieToWatchlistItem(
  item: WatchlistItem
): WatchlistItemWithMovie {
  const movie = db
    .prepare(
      `
      SELECT id, title, description, release_year, director, poster_url, runtime, created_at, updated_at
      FROM movies
      WHERE id = ?
      `
    )
    .get(item.movie_id) as Movie;

  const languages = db
    .prepare(
      `
      SELECT l.id, l.name, l.code
      FROM languages l
      INNER JOIN movie_languages ml ON l.id = ml.language_id
      WHERE ml.movie_id = ?
      `
    )
    .all(item.movie_id) as Language[];

  return {
    ...item,
    movie: {
      ...movie,
      languages,
    },
  };
}

// Batch process all watchlist items with movies and languages
function attachMoviesToWatchlistItems(
  items: WatchlistItem[]
): WatchlistItemWithMovie[] {
  if (items.length === 0) return [];

  const movieIds = items.map((i) => i.movie_id);

  // Get all movies in one query
  const movies = db
    .prepare(
      `
      SELECT id, title, description, release_year, director, poster_url, runtime, created_at, updated_at
      FROM movies
      WHERE id IN (${movieIds.map(() => "?").join(",")})
      `
    )
    .all(...movieIds) as Movie[];

  // Get all languages for all movies in one query
  const allLanguages = db
    .prepare(
      `
      SELECT ml.movie_id, l.id, l.name, l.code
      FROM languages l
      INNER JOIN movie_languages ml ON l.id = ml.language_id
      WHERE ml.movie_id IN (${movieIds.map(() => "?").join(",")})
      `
    )
    .all(...movieIds) as Array<Language & { movie_id: number }>;

  // Create maps for faster lookups
  const movieMap = new Map<number, Movie>();
  movies.forEach((m) => movieMap.set(m.id, m));

  const languageMap = new Map<number, Language[]>();
  allLanguages.forEach((lang) => {
    if (!languageMap.has(lang.movie_id)) {
      languageMap.set(lang.movie_id, []);
    }
    const { movie_id, ...language } = lang;
    languageMap.get(lang.movie_id)!.push(language);
  });

  // Combine everything
  return items.map((item) => {
    const movie = movieMap.get(item.movie_id)!;
    const languages = languageMap.get(item.movie_id) || [];
    return {
      ...item,
      movie: {
        ...movie,
        languages,
      },
    };
  });
}

// GET /watchlist - Get all watchlist items or filter by status
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

    // Group items by status for easier frontend rendering
    const grouped = itemsWithMovies.reduce((acc, item) => {
      if (!acc[item.status]) {
        acc[item.status] = [];
      }
      acc[item.status].push(item);
      return acc;
    }, {} as Record<string, WatchlistItemWithMovie[]>);

    res.json({
      success: true,
      count: itemsWithMovies.length,
      items: itemsWithMovies,
      grouped,
    });
  } catch (err: any) {
    console.error("Error fetching watchlist:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch watchlist",
      message: err.message,
    });
  }
});

// GET /watchlist/:id - Get a single watchlist item
router.get("/:id", (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid watchlist ID",
      });
    }

    const item = selectWatchlistByIdStmt.get(id) as WatchlistItem | undefined;
    if (!item) {
      return res.status(404).json({
        success: false,
        error: "Watchlist item not found",
      });
    }

    const itemWithMovie = attachMovieToWatchlistItem(item);
    res.json({
      success: true,
      item: itemWithMovie,
    });
  } catch (err: any) {
    console.error("Error fetching watchlist item:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch watchlist item",
      message: err.message,
    });
  }
});

// POST /watchlist - Add a movie to watchlist
router.post("/", (req: Request, res: Response) => {
  try {
    const { movie_id, status = "want_to_watch" } =
      req.body as AddToWatchlistRequest;

    if (!movie_id) {
      return res.status(400).json({
        success: false,
        error: "movie_id is required",
      });
    }

    const validStatuses = ["want_to_watch", "watching", "watched"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Check if movie exists
    const movieExists = db
      .prepare(`SELECT id FROM movies WHERE id = ?`)
      .get(movie_id);
    if (!movieExists) {
      return res.status(404).json({
        success: false,
        error: "Movie not found",
      });
    }

    // Check if already in watchlist
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
    const itemWithMovie = attachMovieToWatchlistItem(item);

    res.status(201).json({
      success: true,
      message: "Movie added to watchlist",
      item: itemWithMovie,
    });
  } catch (err: any) {
    console.error("Error adding to watchlist:", err);
    res.status(500).json({
      success: false,
      error: "Failed to add to watchlist",
      message: err.message,
    });
  }
});

// PATCH /watchlist/:id - Update watchlist item status
router.patch("/:id", (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid watchlist ID",
      });
    }

    const existing = selectWatchlistByIdStmt.get(id) as
      | WatchlistItem
      | undefined;
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Watchlist item not found",
      });
    }

    const { status } = req.body as UpdateWatchlistRequest;
    if (!status) {
      return res.status(400).json({
        success: false,
        error: "status is required",
      });
    }

    const validStatuses = ["want_to_watch", "watching", "watched"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Set watched_at timestamp if status is 'watched'
    const watchedAt = status === "watched" ? new Date().toISOString() : null;

    updateWatchlistStatusStmt.run(status, watchedAt, id);

    const item = selectWatchlistByIdStmt.get(id) as WatchlistItem;
    const itemWithMovie = attachMovieToWatchlistItem(item);

    res.json({
      success: true,
      message: "Watchlist item updated",
      item: itemWithMovie,
    });
  } catch (err: any) {
    console.error("Error updating watchlist:", err);
    res.status(500).json({
      success: false,
      error: "Failed to update watchlist",
      message: err.message,
    });
  }
});

// DELETE /watchlist/:id - Remove item from watchlist
router.delete("/:id", (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid watchlist ID",
      });
    }

    const item = selectWatchlistByIdStmt.get(id) as WatchlistItem | undefined;
    if (!item) {
      return res.status(404).json({
        success: false,
        error: "Watchlist item not found",
      });
    }

    const info = deleteWatchlistStmt.run(id);
    if (info.changes === 0) {
      return res.status(404).json({
        success: false,
        error: "Watchlist item not found",
      });
    }

    res.json({
      success: true,
      message: "Removed from watchlist",
      deletedItem: {
        id: item.id,
        movie_id: item.movie_id,
      },
    });
  } catch (err: any) {
    console.error("Error deleting from watchlist:", err);
    res.status(500).json({
      success: false,
      error: "Failed to remove from watchlist",
      message: err.message,
    });
  }
});

// GET /watchlist/movie/:movieId - Check if a movie is in watchlist
router.get("/movie/:movieId", (req: Request, res: Response) => {
  try {
    const movieId = parseInt(req.params.movieId);
    if (isNaN(movieId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid movie ID",
      });
    }

    const item = selectWatchlistByMovieIdStmt.get(movieId) as
      | WatchlistItem
      | undefined;
    if (!item) {
      return res.json({
        success: true,
        inWatchlist: false,
        item: null,
      });
    }

    const itemWithMovie = attachMovieToWatchlistItem(item);
    res.json({
      success: true,
      inWatchlist: true,
      item: itemWithMovie,
    });
  } catch (err: any) {
    console.error("Error checking watchlist:", err);
    res.status(500).json({
      success: false,
      error: "Failed to check watchlist",
      message: err.message,
    });
  }
});

export default router;
