import express, { Request, Response, Router } from "express";
import db from "../db";
import type { TVShowCard, TVShow, TVShowWithDetails, UuidParam, IdParam } from "shared-types";

const router: Router = express.Router();

function getWatchlistSet(): Set<number> {
  // Assuming watchlist table might support show_id in the future,
  // For now it only supports movie_id.
  return new Set();
}

function toTVShowCards(shows: TVShow[], watchlistSet: Set<number>): TVShowCard[] {
  return shows.map((s) => ({
    id: s.id,
    uuid: s.uuid,
    type: "tv",
    title: s.title,
    poster_url: s.poster_url,
    backdrop_url: s.backdrop_url,
    release_year: s.first_air_date ? parseInt(s.first_air_date.substring(0, 4)) : undefined,
    status: s.status ?? "returning_series",
    tmdb_id: s.tmdb_id,
    in_watchlist: false, // Wait for show_id support in watchlist
    genres: [], // Wait for tv_genres support
  }));
}

// ── GET /tv/recent ────────────────────────────────────────────────────────────
router.get("/recent", (_req: Request, res: Response) => {
  try {
    const shows = db
      .prepare(`SELECT * FROM tv_shows ORDER BY first_air_date DESC LIMIT 20`)
      .all() as TVShow[];
    const cards = toTVShowCards(shows, getWatchlistSet());
    res.json({ success: true, data: cards });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch recent TV shows",
      message: err.message,
    });
  }
});

// ── GET /tv/top-rated ─────────────────────────────────────────────────────────
router.get("/top-rated", (_req: Request, res: Response) => {
  try {
    // For dummy purposes, we'll sort by title since we don't have rating_imdb on tv_shows yet.
    const shows = db
      .prepare(`SELECT * FROM tv_shows ORDER BY title ASC LIMIT 20`)
      .all() as TVShow[];
    const cards = toTVShowCards(shows, getWatchlistSet());
    res.json({ success: true, data: cards });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch top-rated TV shows",
      message: err.message,
    });
  }
});

// ── GET /tv ───────────────────────────────────────────────────────────────────
router.get("/", (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    let query = "SELECT * FROM tv_shows";
    let params: any[] = [];
    
    if (search?.trim()) {
      query += " WHERE title LIKE ?";
      params.push(`%${search.trim()}%`);
    }
    
    query += " ORDER BY title ASC LIMIT 50";
    
    const shows = db.prepare(query).all(...params) as TVShow[];
    const cards = toTVShowCards(shows, getWatchlistSet());
    res.json({ success: true, data: cards });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch TV shows",
      message: err.message,
    });
  }
});

// ── GET /tv/:uuid ──────────────────────────────────────────────────────────────
router.get("/:uuid", (req: Request<UuidParam>, res: Response) => {
  try {
    const uuid = req.params.uuid;
    const show = db.prepare(`SELECT * FROM tv_shows WHERE uuid = ?`).get(uuid) as TVShow | undefined;
    
    if (!show) {
      return res.status(404).json({ success: false, error: "TV Show not found" });
    }

    const showWithDetails: TVShowWithDetails = {
      ...show,
      in_watchlist: false,
      seasons: [],
      cast: [],
    };

    res.json({ success: true, data: showWithDetails });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch TV show",
      message: err.message,
    });
  }
});

export default router;
