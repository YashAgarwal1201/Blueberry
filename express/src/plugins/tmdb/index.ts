/**
 * tmdb/index.ts
 *
 * High-level TMDB plugin API.
 * Composes client + mapper + ingester into single-call functions.
 */

import { tmdbClient } from "./client";
import { mapTMDBMovie, mapTMDBTV } from "./mapper";
import { ingestMovie, ingestTVShow } from "../ingester";
import type { IngestResult } from "shared-types";

export { tmdbClient };

export interface TMDBIngestOptions {
  overwrite?: boolean;
}

/**
 * Fetch a movie from TMDB by its TMDB ID and persist it to the DB.
 */
export async function ingestMovieByTMDBId(
  tmdbId: number,
  options?: TMDBIngestOptions,
): Promise<IngestResult> {
  const raw = await tmdbClient.getMovie(tmdbId);
  const payload = mapTMDBMovie(raw);
  return ingestMovie(payload, options);
}

/**
 * Fetch a TV show from TMDB by its TMDB ID and persist it to the DB.
 */
export async function ingestTVByTMDBId(
  tmdbId: number,
  options?: TMDBIngestOptions,
): Promise<IngestResult> {
  const raw = await tmdbClient.getTV(tmdbId);
  const payload = mapTMDBTV(raw);
  return ingestTVShow(payload, options);
}

/**
 * Search TMDB for a movie by title and ingest the first result.
 */
export async function ingestMovieBySearch(
  query: string,
  options?: TMDBIngestOptions,
): Promise<IngestResult> {
  const { results } = await tmdbClient.searchMovies(query);
  if (!results.length) throw new Error(`No TMDB movie found for "${query}"`);
  return ingestMovieByTMDBId(results[0].id, options);
}

/**
 * Search TMDB for a TV show by title and ingest the first result.
 */
export async function ingestTVBySearch(
  query: string,
  options?: TMDBIngestOptions,
): Promise<IngestResult> {
  const { results } = await tmdbClient.searchTV(query);
  if (!results.length) throw new Error(`No TMDB TV show found for "${query}"`);
  return ingestTVByTMDBId(results[0].id, options);
}

/**
 * Bulk ingest popular movies (1 page = 20 movies).
 */
export async function ingestPopularMovies(
  pages = 1,
  options?: TMDBIngestOptions,
): Promise<IngestResult[]> {
  const results: IngestResult[] = [];
  for (let page = 1; page <= pages; page++) {
    const { results: movies } = await tmdbClient.getPopularMovies(page);
    for (const m of movies) {
      try {
        const r = await ingestMovieByTMDBId(m.id, options);
        results.push(r);
        console.log(`  [tmdb] ${r.action.padEnd(7)} movie: ${r.title}`);
      } catch (err: any) {
        console.error(`  [tmdb] FAILED movie ${m.id} (${m.title}): ${err.message}`);
      }
    }
  }
  return results;
}

/**
 * Bulk ingest popular TV shows (1 page = 20 shows).
 */
export async function ingestPopularTV(
  pages = 1,
  options?: TMDBIngestOptions,
): Promise<IngestResult[]> {
  const results: IngestResult[] = [];
  for (let page = 1; page <= pages; page++) {
    const { results: shows } = await tmdbClient.getPopularTV(page);
    for (const s of shows) {
      try {
        const r = await ingestTVByTMDBId(s.id, options);
        results.push(r);
        console.log(`  [tmdb] ${r.action.padEnd(7)} show:  ${r.title}`);
      } catch (err: any) {
        console.error(`  [tmdb] FAILED show ${s.id} (${s.name}): ${err.message}`);
      }
    }
  }
  return results;
}
