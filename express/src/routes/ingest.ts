/**
 * routes/ingest.ts
 *
 * On-demand ingestion endpoint.
 * Lets you fetch + store a movie or TV show from TMDB by ID or search query.
 *
 * POST /ingest/tmdb/movie/:tmdbId
 * POST /ingest/tmdb/tv/:tmdbId
 * POST /ingest/tmdb/search/movie   body: { query: string }
 * POST /ingest/tmdb/search/tv      body: { query: string }
 * POST /ingest/tmdb/popular/movies body: { pages?: number }
 * POST /ingest/tmdb/popular/tv     body: { pages?: number }
 */

import express, { Request, Response, Router } from "express";
import {
  ingestMovieByTMDBId,
  ingestTVByTMDBId,
  ingestMovieBySearch,
  ingestTVBySearch,
  ingestPopularMovies,
  ingestPopularTV,
  tmdbClient,
} from "../plugins/tmdb";

const router: Router = express.Router();

function notConfigured(res: Response) {
  return res.status(503).json({
    success: false,
    error: "TMDB plugin not configured. Set TMDB_API_KEY in express/.env",
  });
}

// ── Status ────────────────────────────────────────────────────────────────────
router.get("/status", (_req: Request, res: Response) => {
  res.json({
    success: true,
    tmdb: {
      configured: tmdbClient.isConfigured(),
    },
  });
});

// ── Movie by TMDB ID ──────────────────────────────────────────────────────────
router.post("/tmdb/movie/:tmdbId", async (req: Request, res: Response) => {
  if (!tmdbClient.isConfigured()) return notConfigured(res);

  const tmdbId = parseInt(req.params.tmdbId as string);
  if (isNaN(tmdbId))
    return res.status(400).json({ success: false, error: "Invalid TMDB ID" });

  const overwrite = req.body?.overwrite !== false; // default true

  try {
    const result = await ingestMovieByTMDBId(tmdbId, { overwrite });
    res.status(result.action === "created" ? 201 : 200).json({ success: true, data: result });
  } catch (err: any) {
    console.error("[ingest] movie", tmdbId, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── TV by TMDB ID ─────────────────────────────────────────────────────────────
router.post("/tmdb/tv/:tmdbId", async (req: Request, res: Response) => {
  if (!tmdbClient.isConfigured()) return notConfigured(res);

  const tmdbId = parseInt(req.params.tmdbId as string);
  if (isNaN(tmdbId))
    return res.status(400).json({ success: false, error: "Invalid TMDB ID" });

  const overwrite = req.body?.overwrite !== false;

  try {
    const result = await ingestTVByTMDBId(tmdbId, { overwrite });
    res.status(result.action === "created" ? 201 : 200).json({ success: true, data: result });
  } catch (err: any) {
    console.error("[ingest] tv", tmdbId, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Movie search ──────────────────────────────────────────────────────────────
router.post("/tmdb/search/movie", async (req: Request, res: Response) => {
  if (!tmdbClient.isConfigured()) return notConfigured(res);

  const { query } = req.body as { query?: string };
  if (!query?.trim())
    return res.status(400).json({ success: false, error: "query is required" });

  try {
    const result = await ingestMovieBySearch(query.trim());
    res.status(result.action === "created" ? 201 : 200).json({ success: true, data: result });
  } catch (err: any) {
    console.error("[ingest] search movie", query, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── TV search ─────────────────────────────────────────────────────────────────
router.post("/tmdb/search/tv", async (req: Request, res: Response) => {
  if (!tmdbClient.isConfigured()) return notConfigured(res);

  const { query } = req.body as { query?: string };
  if (!query?.trim())
    return res.status(400).json({ success: false, error: "query is required" });

  try {
    const result = await ingestTVBySearch(query.trim());
    res.status(result.action === "created" ? 201 : 200).json({ success: true, data: result });
  } catch (err: any) {
    console.error("[ingest] search tv", query, err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Bulk: popular movies ──────────────────────────────────────────────────────
router.post("/tmdb/popular/movies", async (req: Request, res: Response) => {
  if (!tmdbClient.isConfigured()) return notConfigured(res);

  const pages = Math.min(parseInt(req.body?.pages ?? "1"), 5); // max 5 pages = 100 movies
  if (isNaN(pages) || pages < 1)
    return res.status(400).json({ success: false, error: "pages must be 1–5" });

  try {
    const results = await ingestPopularMovies(pages);
    const summary = {
      total: results.length,
      created: results.filter((r) => r.action === "created").length,
      updated: results.filter((r) => r.action === "updated").length,
      skipped: results.filter((r) => r.action === "skipped").length,
    };
    res.json({ success: true, data: results, summary });
  } catch (err: any) {
    console.error("[ingest] popular movies", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Bulk: popular TV ──────────────────────────────────────────────────────────
router.post("/tmdb/popular/tv", async (req: Request, res: Response) => {
  if (!tmdbClient.isConfigured()) return notConfigured(res);

  const pages = Math.min(parseInt(req.body?.pages ?? "1"), 5);
  if (isNaN(pages) || pages < 1)
    return res.status(400).json({ success: false, error: "pages must be 1–5" });

  try {
    const results = await ingestPopularTV(pages);
    const summary = {
      total: results.length,
      created: results.filter((r) => r.action === "created").length,
      updated: results.filter((r) => r.action === "updated").length,
      skipped: results.filter((r) => r.action === "skipped").length,
    };
    res.json({ success: true, data: results, summary });
  } catch (err: any) {
    console.error("[ingest] popular tv", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
