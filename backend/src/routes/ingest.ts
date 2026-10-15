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
 * 
 * POST /ingest/wikidata/search/movie body: { query: string }
 */

import { Hono } from "hono";
import {
  ingestMovieByTMDBId,
  ingestTVByTMDBId,
  ingestMovieBySearch,
  ingestTVBySearch,
  ingestPopularMovies,
  ingestPopularTV,
  tmdbClient,
} from "../plugins/tmdb";
import { ingestMovieBySearch as ingestWikidataMovieBySearch } from "../plugins/wikidata";
import { getErrorMessage } from "../utils/errors";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

function notConfigured() {
  return {
    success: false,
    error: "TMDB plugin not configured. Set TMDB_API_KEY in backend/.env",
  };
}

// ── Status ────────────────────────────────────────────────────────────────────
router.get("/status", (c) => {
  return c.json({
    success: true,
    tmdb: {
      configured: tmdbClient.isConfigured(),
    },
  });
});

// ── Movie by TMDB ID ──────────────────────────────────────────────────────────
router.post("/tmdb/movie/:tmdbId", async (c) => {
  if (!tmdbClient.isConfigured()) return c.json(notConfigured(), 503);

  const tmdbId = parseInt(c.req.param("tmdbId"));
  if (isNaN(tmdbId))
    return c.json({ success: false, error: "Invalid TMDB ID" }, 400);

  const body = await c.req.json<{ overwrite?: boolean }>().catch(() => ({} as { overwrite?: boolean }));
  const overwrite = body?.overwrite !== false; // default true

  try {
    const result = await ingestMovieByTMDBId(tmdbId, { overwrite });
    return c.json({ success: true, data: result }, result.action === "created" ? 201 : 200);
  } catch (err: unknown) {
    const msg = getErrorMessage(err);
    console.error("[ingest] movie", tmdbId, msg);
    return c.json({ success: false, error: msg }, 500);
  }
});

// ── TV by TMDB ID ─────────────────────────────────────────────────────────────
router.post("/tmdb/tv/:tmdbId", async (c) => {
  if (!tmdbClient.isConfigured()) return c.json(notConfigured(), 503);

  const tmdbId = parseInt(c.req.param("tmdbId"));
  if (isNaN(tmdbId))
    return c.json({ success: false, error: "Invalid TMDB ID" }, 400);

  const body = await c.req.json<{ overwrite?: boolean }>().catch(() => ({} as { overwrite?: boolean }));
  const overwrite = body?.overwrite !== false;

  try {
    const result = await ingestTVByTMDBId(tmdbId, { overwrite });
    return c.json({ success: true, data: result }, result.action === "created" ? 201 : 200);
  } catch (err: unknown) {
    const msg = getErrorMessage(err);
    console.error("[ingest] tv", tmdbId, msg);
    return c.json({ success: false, error: msg }, 500);
  }
});

// ── Movie search ──────────────────────────────────────────────────────────────
router.post("/tmdb/search/movie", async (c) => {
  if (!tmdbClient.isConfigured()) return c.json(notConfigured(), 503);

  const body = await c.req.json<{ query?: string }>().catch(() => ({} as { query?: string }));
  const { query } = body;
  if (!query?.trim())
    return c.json({ success: false, error: "query is required" }, 400);

  try {
    const result = await ingestMovieBySearch(query.trim());
    return c.json({ success: true, data: result }, result.action === "created" ? 201 : 200);
  } catch (err: unknown) {
    const msg = getErrorMessage(err);
    console.error("[ingest] search movie", query, msg);
    return c.json({ success: false, error: msg }, 500);
  }
});

// ── TV search ─────────────────────────────────────────────────────────────────
router.post("/tmdb/search/tv", async (c) => {
  if (!tmdbClient.isConfigured()) return c.json(notConfigured(), 503);

  const body = await c.req.json<{ query?: string }>().catch(() => ({} as { query?: string }));
  const { query } = body;
  if (!query?.trim())
    return c.json({ success: false, error: "query is required" }, 400);

  try {
    const result = await ingestTVBySearch(query.trim());
    return c.json({ success: true, data: result }, result.action === "created" ? 201 : 200);
  } catch (err: unknown) {
    const msg = getErrorMessage(err);
    console.error("[ingest] search tv", query, msg);
    return c.json({ success: false, error: msg }, 500);
  }
});

// ── Bulk: popular movies ──────────────────────────────────────────────────────
router.post("/tmdb/popular/movies", async (c) => {
  if (!tmdbClient.isConfigured()) return c.json(notConfigured(), 503);

  const body = await c.req.json<{ pages?: number | string }>().catch(() => ({} as { pages?: number | string }));
  const pages = Math.min(parseInt(String(body?.pages ?? "1")), 5); // max 5 pages = 100 movies
  if (isNaN(pages) || pages < 1)
    return c.json({ success: false, error: "pages must be 1–5" }, 400);

  try {
    const results = await ingestPopularMovies(pages);
    const summary = {
      total: results.length,
      created: results.filter((r) => r.action === "created").length,
      updated: results.filter((r) => r.action === "updated").length,
      skipped: results.filter((r) => r.action === "skipped").length,
    };
    return c.json({ success: true, data: results, summary });
  } catch (err: unknown) {
    const msg = getErrorMessage(err);
    console.error("[ingest] popular movies", msg);
    return c.json({ success: false, error: msg }, 500);
  }
});

// ── Bulk: popular TV ──────────────────────────────────────────────────────────
router.post("/tmdb/popular/tv", async (c) => {
  if (!tmdbClient.isConfigured()) return c.json(notConfigured(), 503);

  const body = await c.req.json<{ pages?: number | string }>().catch(() => ({} as { pages?: number | string }));
  const pages = Math.min(parseInt(String(body?.pages ?? "1")), 5);
  if (isNaN(pages) || pages < 1)
    return c.json({ success: false, error: "pages must be 1–5" }, 400);

  try {
    const results = await ingestPopularTV(pages);
    const summary = {
      total: results.length,
      created: results.filter((r) => r.action === "created").length,
      updated: results.filter((r) => r.action === "updated").length,
      skipped: results.filter((r) => r.action === "skipped").length,
    };
    return c.json({ success: true, data: results, summary });
  } catch (err: unknown) {
    const msg = getErrorMessage(err);
    console.error("[ingest] popular tv", msg);
    return c.json({ success: false, error: msg }, 500);
  }
});

// ── Wikidata Movie search ─────────────────────────────────────────────────────
router.post("/wikidata/search/movie", async (c) => {
  const body = await c.req.json<{ query?: string; overwrite?: boolean }>().catch(() => ({} as { query?: string; overwrite?: boolean }));
  const { query } = body;
  if (!query?.trim())
    return c.json({ success: false, error: "query is required" }, 400);

  const overwrite = body?.overwrite !== false;

  try {
    const result = await ingestWikidataMovieBySearch(query.trim(), { overwrite });
    return c.json({ success: true, data: result }, result.action === "created" ? 201 : 200);
  } catch (err: unknown) {
    const msg = getErrorMessage(err);
    console.error("[ingest] wikidata search movie", query, msg);
    return c.json({ success: false, error: msg }, 500);
  }
});

export default router;
