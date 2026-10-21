// src/routes/search.ts
import { Hono } from "hono";
import db, { movies as moviesTable, tvShows as tvShowsTable } from "../db";
import { inArray } from "drizzle-orm";
import { tmdbClient, ingestMovieByTMDBId, ingestTVByTMDBId } from "../plugins/tmdb";
import { getErrorMessage } from "../utils/errors";
import type { AppEnv } from "../types";
import type { RemoteSearchResult, ImportMediaRequest } from "shared-types";

const router = new Hono<AppEnv>();

/**
 * GET /search/remote?q=...
 * Searches TMDB for movies and TV shows when local library has low/no results.
 * Cross-references local SQLite DB to mark items as already_imported if they exist.
 */
router.get("/remote", async (c) => {
  const q = c.req.query("q")?.trim() ?? "";
  if (!q) {
    return c.json({ success: true, data: [], configured: tmdbClient.isConfigured() });
  }

  if (!tmdbClient.isConfigured()) {
    return c.json({
      success: true,
      data: [],
      configured: false,
      message: "TMDB_API_KEY is not configured",
    });
  }

  try {
    const tmdbRes = await tmdbClient.searchMulti(q);
    const results = tmdbRes.results || [];

    // Filter to movies and TV shows only
    const mediaItems = results.filter(
      (item) => item.media_type === "movie" || item.media_type === "tv"
    );

    const movieTmdbIds = mediaItems
      .filter((m) => m.media_type === "movie")
      .map((m) => m.id);

    const tvTmdbIds = mediaItems
      .filter((m) => m.media_type === "tv")
      .map((m) => m.id);

    // Cross-reference with existing local library
    const existingMovies = movieTmdbIds.length > 0
      ? db
          .select({ tmdb_id: moviesTable.tmdb_id, uuid: moviesTable.uuid, id: moviesTable.id })
          .from(moviesTable)
          .where(inArray(moviesTable.tmdb_id, movieTmdbIds))
          .all()
      : [];

    const existingShows = tvTmdbIds.length > 0
      ? db
          .select({ tmdb_id: tvShowsTable.tmdb_id, uuid: tvShowsTable.uuid, id: tvShowsTable.id })
          .from(tvShowsTable)
          .where(inArray(tvShowsTable.tmdb_id, tvTmdbIds))
          .all()
      : [];

    const movieMap = new Map(existingMovies.map((m) => [m.tmdb_id, m]));
    const showMap = new Map(existingShows.map((s) => [s.tmdb_id, s]));

    const formatted: RemoteSearchResult[] = mediaItems.map((item) => {
      const isMovie = item.media_type === "movie";
      const local = isMovie ? movieMap.get(item.id) : showMap.get(item.id);
      const dateStr = item.release_date || item.first_air_date;
      const parsedYear = dateStr ? parseInt(dateStr.substring(0, 4), 10) : null;
      const releaseYear = isNaN(parsedYear as number) ? null : parsedYear;

      return {
        id: item.id,
        tmdb_id: item.id,
        title: item.title || item.name || "Untitled",
        media_type: item.media_type as "movie" | "tv",
        release_year: releaseYear,
        poster_url: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : null,
        backdrop_url: (item as any).backdrop_path
          ? `https://image.tmdb.org/t/p/w1280${(item as any).backdrop_path}`
          : null,
        overview: (item as any).overview || null,
        vote_average: item.vote_average ?? null,
        already_imported: !!local,
        local_id: local?.id,
        local_uuid: local?.uuid,
      };
    });

    return c.json({
      success: true,
      data: formatted,
      configured: true,
    });
  } catch (err: unknown) {
    const msg = getErrorMessage(err);
    console.error("[search] remote search error:", msg);
    return c.json({
      success: true,
      data: [],
      error: msg,
      configured: true,
    });
  }
});

/**
 * POST /search/import
 * Ingests a movie or TV show on-the-fly from TMDB into the local library.
 */
router.post("/import", async (c) => {
  if (!tmdbClient.isConfigured()) {
    return c.json(
      { success: false, error: "TMDB plugin not configured. Set TMDB_API_KEY in backend/.env" },
      503
    );
  }

  const body = await c.req.json<ImportMediaRequest>().catch(() => ({} as ImportMediaRequest));
  const { tmdbId, mediaType } = body;

  if (!tmdbId || !mediaType) {
    return c.json(
      { success: false, error: "tmdbId and mediaType ('movie' | 'tv') are required" },
      400
    );
  }

  try {
    let result;
    if (mediaType === "movie") {
      result = await ingestMovieByTMDBId(Number(tmdbId), { overwrite: false });
    } else if (mediaType === "tv") {
      result = await ingestTVByTMDBId(Number(tmdbId), { overwrite: false });
    } else {
      return c.json(
        { success: false, error: "mediaType must be 'movie' or 'tv'" },
        400
      );
    }

    return c.json(
      {
        success: true,
        data: {
          ...result,
          mediaType,
        },
      },
      result.action === "created" ? 201 : 200
    );
  } catch (err: unknown) {
    const msg = getErrorMessage(err);
    console.error("[search] on-demand import error:", tmdbId, msg);
    return c.json({ success: false, error: msg }, 500);
  }
});

export default router;
