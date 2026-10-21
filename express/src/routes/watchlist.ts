// src/routes/watchlist.ts

import express, { Request, Response, Router } from "express";
import db from "../db";
import { resolveImage } from "../utils/imageUtils";
import { invalidateWatchlistCache } from "../utils/watchlistCache";
import type {
  WatchlistItem,
  WatchlistPopulatedItem,
  AddToWatchlistRequest,
  UpdateWatchlistRequest,
  IdParam,
  MovieIdParam,
  Movie,
  TVShow,
  MovieCard,
  TVShowCard,
  Language,
  Genre,
  TVEpisode,
} from "shared-types";
import { getErrorMessage } from "../utils/errors";

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
): WatchlistPopulatedItem[] {
  if (items.length === 0) return [];

  const movieIds = items.map((i) => i.movie_id).filter(Boolean) as number[];
  const showIds = items.map((i) => i.show_id).filter(Boolean) as number[];
  
  const movieMap = new Map<number, MovieCard>();
  const showMap = new Map<number, TVShowCard>();

  // Fetch Movies
  if (movieIds.length > 0) {
    const ph = movieIds.map(() => "?").join(",");
    const movies = db.prepare(`SELECT * FROM movies WHERE id IN (${ph})`).all(...movieIds) as Movie[];
    
    const allLanguages = db.prepare(`
       SELECT ml.movie_id, l.id, l.name, l.code
       FROM languages l INNER JOIN movie_languages ml ON l.id = ml.language_id
       WHERE ml.movie_id IN (${ph})
    `).all(...movieIds) as Array<{ movie_id: number; id: number; name: string; code: string }>;

    const allGenres = db.prepare(`
       SELECT mg.movie_id, g.id, g.name, g.slug
       FROM genres g INNER JOIN movie_genres mg ON g.id = mg.genre_id
       WHERE mg.movie_id IN (${ph})
    `).all(...movieIds) as Array<{ movie_id: number; id: number; name: string; slug: string }>;

    const languageMap = new Map<number, Language[]>();
    allLanguages.forEach(({ movie_id, ...lang }) => {
      if (!languageMap.has(movie_id)) languageMap.set(movie_id, []);
      languageMap.get(movie_id)!.push(lang);
    });

    const genreMap = new Map<number, Genre[]>();
    allGenres.forEach(({ movie_id, ...genre }) => {
      if (!genreMap.has(movie_id)) genreMap.set(movie_id, []);
      genreMap.get(movie_id)!.push(genre as Genre);
    });

    movies.forEach(m => {
      movieMap.set(m.id, {
        id: m.id,
        uuid: m.uuid,
        type: 'movie',
        title: m.title,
        poster_url: resolveImage(m.tmdb_poster_path, m.local_poster_url) || m.poster_url,
        backdrop_url: resolveImage(m.tmdb_backdrop_path, m.local_backdrop_url, 'w780') || m.backdrop_url,
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
    const shows = db.prepare(`SELECT * FROM tv_shows WHERE id IN (${ph})`).all(...showIds) as TVShow[];
    
    shows.forEach(s => {
      showMap.set(s.id, {
        id: s.id,
        uuid: s.uuid,
        type: 'tv',
        title: s.title,
        poster_url: resolveImage(s.tmdb_poster_path, null) || s.poster_url,
        backdrop_url: resolveImage(s.tmdb_backdrop_path, null, 'w780') || s.backdrop_url,
        release_year: s.first_air_date ? parseInt(s.first_air_date.substring(0, 4)) : undefined,
        status: s.status ?? "returning_series",
        in_watchlist: true,
        genres: [],
        description: s.description,
      });
    });
  }

  return items.map((item) => {
    const formattedItem = { ...item, liked: !!item.liked };
    if (formattedItem.movie_id) {
      return { ...formattedItem, movie: movieMap.get(formattedItem.movie_id)! } as WatchlistPopulatedItem;
    }
    if (formattedItem.show_id) {
      return { ...formattedItem, show: showMap.get(formattedItem.show_id)! } as WatchlistPopulatedItem;
    }
    return formattedItem as WatchlistPopulatedItem;
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
  } catch (err: unknown) {
    console.error("Error checking watchlist:", err);
    res.status(500).json({ success: false, error: "Failed to check watchlist", message: getErrorMessage(err) });
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
  } catch (err: unknown) {
    console.error("Error checking watchlist:", err);
    res.status(500).json({ success: false, error: "Failed to check watchlist", message: getErrorMessage(err) });
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
    }, {} as Record<string, WatchlistPopulatedItem[]>);

    res.json({ success: true, data: { items: populatedItems, grouped } });
  } catch (err: unknown) {
    console.error("Error fetching watchlist:", err);
    res.status(500).json({ success: false, error: "Failed to fetch watchlist", message: getErrorMessage(err) });
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
  } catch (err: unknown) {
    console.error("Error fetching watchlist item:", err);
    res.status(500).json({ success: false, error: "Failed to fetch watchlist item", message: getErrorMessage(err) });
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

    invalidateWatchlistCache();
    res.status(201).json({ success: true, message: "Added to watchlist", data: populated });
  } catch (err: unknown) {
    console.error("Error adding to watchlist:", err);
    res.status(500).json({ success: false, error: "Failed to add to watchlist", message: getErrorMessage(err) });
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

    invalidateWatchlistCache();
    res.json({ success: true, message: "Watchlist item updated", data: populated });
  } catch (err: unknown) {
    console.error("Error updating watchlist:", err);
    res.status(500).json({ success: false, error: "Failed to update watchlist", message: getErrorMessage(err) });
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
    invalidateWatchlistCache();
    res.json({ success: true, message: "Removed from watchlist", data: { id: item.id } });
  } catch (err: unknown) {
    console.error("Error deleting from watchlist:", err);
    res.status(500).json({ success: false, error: "Failed to remove from watchlist", message: getErrorMessage(err) });
  }
});

// ── Continue Watching (TV) ───────────────────────────────────────────────────

router.get("/tv/continue-watching", (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });
    
    // 1. Get shows the user has watched episodes of, with their max season and episode
    const progressStmt = db.prepare(`
      SELECT 
        show_id, 
        MAX(season_number) as max_season, 
        MAX(episode_number) as max_episode
      FROM user_watched_episodes 
      WHERE user_id = ?
      GROUP BY show_id
    `);
    const progress = progressStmt.all(userId) as Array<{
      show_id: number;
      max_season: number;
      max_episode: number;
    }>;

    if (!progress.length) {
      return res.json({ success: true, data: [] });
    }

    const nextEpisodes = [];
    
    for (const p of progress) {
      const nextEpStmt = db.prepare(`
        SELECT e.* 
        FROM tv_episodes e
        JOIN tv_seasons s ON e.season_id = s.id
        WHERE e.show_id = ? 
          AND (
            (s.season_number = ? AND e.episode_number > ?)
            OR (s.season_number > ?)
          )
        ORDER BY s.season_number ASC, e.episode_number ASC
        LIMIT 1
      `);
      
      const nextEp = nextEpStmt.get(p.show_id, p.max_season, p.max_episode, p.max_season) as TVEpisode | undefined;
      
      if (nextEp) {
        // Fetch show details
        const show = db.prepare(`SELECT * FROM tv_shows WHERE id = ?`).get(p.show_id) as TVShow | undefined;
        if (show) {
          const resolvedShow = {
            ...show,
            poster_url: resolveImage(show.tmdb_poster_path, null) || show.poster_url,
            backdrop_url: resolveImage(show.tmdb_backdrop_path, null, 'w780') || show.backdrop_url,
          };
          const resolvedNextEp = {
            ...nextEp,
            still_url: resolveImage(nextEp.tmdb_still_path, null) || nextEp.still_url,
          };

          nextEpisodes.push({
            show: resolvedShow,
            nextEpisode: resolvedNextEp,
            progressPercentage: 0 
          });
        }
      }
    }
    
    res.json({ success: true, data: nextEpisodes });
  } catch (err: unknown) {
    console.error("Error fetching continue watching:", err);
    res.status(500).json({ success: false, error: "Failed to fetch continue watching feed", message: getErrorMessage(err) });
  }
});

router.get("/tv/:showId/watched-episodes", (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });

    const showId = parseInt(req.params.showId as string);
    if (isNaN(showId)) return res.status(400).json({ success: false, error: "Invalid show ID" });

    const episodes = db.prepare(`
      SELECT episode_id 
      FROM user_watched_episodes 
      WHERE user_id = ? AND show_id = ?
    `).all(userId, showId) as { episode_id: number }[];

    res.json({ success: true, data: episodes.map(e => e.episode_id) });
  } catch (err: unknown) {
    console.error("Error fetching watched episodes:", err);
    res.status(500).json({ success: false, error: "Failed to fetch watched episodes", message: getErrorMessage(err) });
  }
});

router.post("/tv/:showId/episodes/:episodeId/watched", (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });
    const showId = parseInt(req.params.showId as string);
    const episodeId = parseInt(req.params.episodeId as string);

    // Get episode info
    const episode = db.prepare(`
      SELECT e.episode_number, s.season_number, s.id as season_id
      FROM tv_episodes e
      JOIN tv_seasons s ON e.season_id = s.id
      WHERE e.id = ? AND e.show_id = ?
    `).get(episodeId, showId) as { episode_number: number; season_number: number; season_id: number } | undefined;

    if (!episode) return res.status(404).json({ success: false, error: "Episode not found" });

    // Insert into user_watched_episodes
    db.prepare(`
      INSERT OR IGNORE INTO user_watched_episodes (user_id, show_id, season_id, episode_id, season_number, episode_number)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, showId, episode.season_id, episodeId, episode.season_number, episode.episode_number);

    // Also update watchlist status to 'watching' if not already there
    db.prepare(`
      INSERT INTO watchlist (show_id, status, source)
      VALUES (?, 'watching', 'manual')
      ON CONFLICT(show_id) DO UPDATE SET status = 'watching' WHERE status = 'want_to_watch'
    `).run(showId);

    res.json({ success: true, message: "Episode marked as watched" });
  } catch (err: unknown) {
    console.error("Error marking episode watched:", err);
    res.status(500).json({ success: false, error: "Failed to mark episode watched", message: getErrorMessage(err) });
  }
});

router.delete("/tv/:showId/episodes/:episodeId/watched", (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });
    const episodeId = parseInt(req.params.episodeId as string);

    db.prepare(`
      DELETE FROM user_watched_episodes 
      WHERE user_id = ? AND episode_id = ?
    `).run(userId, episodeId);

    res.json({ success: true, message: "Episode unmarked as watched" });
  } catch (err: unknown) {
    console.error("Error unmarking episode:", err);
    res.status(500).json({ success: false, error: "Failed to unmark episode", message: getErrorMessage(err) });
  }
});

router.post("/tv/:showId/seasons/:seasonId/watched", (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });
    const showId = parseInt(req.params.showId as string);
    const seasonId = parseInt(req.params.seasonId as string);

    // Get all episodes for this season
    const episodes = db.prepare(`
      SELECT e.id as episode_id, e.episode_number, s.season_number
      FROM tv_episodes e
      JOIN tv_seasons s ON e.season_id = s.id
      WHERE s.id = ? AND e.show_id = ?
    `).all(seasonId, showId) as Array<{ episode_id: number; episode_number: number; season_number: number }>;

    if (!episodes.length) {
       return res.status(404).json({ success: false, error: "Season or episodes not found" });
    }

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO user_watched_episodes (user_id, show_id, season_id, episode_id, season_number, episode_number)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      for (const ep of episodes) {
        insertStmt.run(userId, showId, seasonId, ep.episode_id, ep.season_number, ep.episode_number);
      }
      
      // Update watchlist
      db.prepare(`
        INSERT INTO watchlist (show_id, status, source)
        VALUES (?, 'watching', 'manual')
        ON CONFLICT(show_id) DO UPDATE SET status = 'watching' WHERE status = 'want_to_watch'
      `).run(showId);
    })();

    res.json({ success: true, message: "Season marked as watched" });
  } catch (err: unknown) {
    console.error("Error marking season watched:", err);
    res.status(500).json({ success: false, error: "Failed to mark season watched", message: getErrorMessage(err) });
  }
});

export default router;
