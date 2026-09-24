/**
 * ingester.ts
 *
 * Core ingestion engine. Accepts normalized PluginMoviePayload / PluginTVPayload
 * and upserts into the DB. Handles resolution of genres, languages, people, companies.
 *
 * This is the single source of truth for all data writes from external providers.
 */

import db from "../db";
import type {
  PluginMoviePayload,
  PluginTVPayload,
  IngestResult,
} from "shared-types";

// ── Lookup helpers ────────────────────────────────────────────────────────────

function resolveGenreId(slug: string): number | null {
  const row = db
    .prepare(`SELECT id FROM genres WHERE slug = ? OR lower(name) = ?`)
    .get(slug.toLowerCase(), slug.toLowerCase()) as { id: number } | undefined;
  return row?.id ?? null;
}

function resolveLanguageId(code: string): number | null {
  const row = db
    .prepare(`SELECT id FROM languages WHERE code = ?`)
    .get(code.toLowerCase()) as { id: number } | undefined;
  return row?.id ?? null;
}

function upsertPerson(params: {
  name: string;
  tmdb_id?: number;
  imdb_id?: string;
  tmdb_profile_path?: string;
}): number {
  // Match by tmdb_id first (most reliable), then name
  if (params.tmdb_id) {
    const existing = db
      .prepare(`SELECT id FROM people WHERE tmdb_id = ?`)
      .get(params.tmdb_id) as { id: number } | undefined;
    if (existing) {
      // Update profile path if we now have one
      if (params.tmdb_profile_path) {
        db.prepare(`UPDATE people SET tmdb_profile_path = ? WHERE id = ?`).run(
          params.tmdb_profile_path,
          existing.id,
        );
      }
      return existing.id;
    }
  }

  const byName = db
    .prepare(`SELECT id FROM people WHERE name = ? COLLATE NOCASE`)
    .get(params.name) as { id: number } | undefined;
  if (byName) {
    // Upgrade record with any new external IDs we now have
    if (params.tmdb_id || params.imdb_id || params.tmdb_profile_path) {
      db.prepare(
        `UPDATE people SET
          tmdb_id          = COALESCE(?, tmdb_id),
          imdb_id          = COALESCE(?, imdb_id),
          tmdb_profile_path= COALESCE(?, tmdb_profile_path)
         WHERE id = ?`,
      ).run(
        params.tmdb_id ?? null,
        params.imdb_id ?? null,
        params.tmdb_profile_path ?? null,
        byName.id,
      );
    }
    return byName.id;
  }

  // Create new person
  const info = db
    .prepare(
      `INSERT INTO people (name, tmdb_id, imdb_id, tmdb_profile_path)
       VALUES (?, ?, ?, ?)`,
    )
    .run(
      params.name.trim(),
      params.tmdb_id ?? null,
      params.imdb_id ?? null,
      params.tmdb_profile_path ?? null,
    );
  return info.lastInsertRowid as number;
}

function upsertCompany(params: {
  name: string;
  tmdb_id?: number;
  role: string;
}): number {
  if (params.tmdb_id) {
    const existing = db
      .prepare(`SELECT id FROM companies WHERE tmdb_id = ?`)
      .get(params.tmdb_id) as { id: number } | undefined;
    if (existing) return existing.id;
  }

  const byName = db
    .prepare(`SELECT id FROM companies WHERE name = ? COLLATE NOCASE`)
    .get(params.name) as { id: number } | undefined;
  if (byName) return byName.id;

  const info = db
    .prepare(
      `INSERT INTO companies (name, tmdb_id, type) VALUES (?, ?, ?)`,
    )
    .run(params.name.trim(), params.tmdb_id ?? null, params.role);
  return info.lastInsertRowid as number;
}

// ── Movie ingestion ───────────────────────────────────────────────────────────

export function ingestMovie(payload: PluginMoviePayload, options?: { overwrite?: boolean }): IngestResult {
  const overwrite = options?.overwrite ?? true;

  return db.transaction((): IngestResult => {
    // Check for existing by tmdb_id or title+year
    let existing: { id: number; uuid: string; title: string } | undefined;

    if (payload.tmdb_id) {
      existing = db
        .prepare(`SELECT id, uuid, title FROM movies WHERE tmdb_id = ?`)
        .get(payload.tmdb_id) as typeof existing;
    }
    if (!existing && payload.imdb_id) {
      existing = db
        .prepare(`SELECT id, uuid, title FROM movies WHERE imdb_id = ?`)
        .get(payload.imdb_id) as typeof existing;
    }
    if (!existing && payload.release_year) {
      existing = db
        .prepare(
          `SELECT id, uuid, title FROM movies WHERE lower(title) = ? AND release_year = ?`,
        )
        .get(payload.title.toLowerCase(), payload.release_year) as typeof existing;
    }

    let movieId: number;
    let movieUuid: string;
    let action: IngestResult["action"];

    if (existing) {
      if (!overwrite) {
        return { action: "skipped", id: existing.id, uuid: existing.uuid, title: existing.title, media_type: "movie" };
      }
      // Update existing row
      db.prepare(
        `UPDATE movies SET
          title              = COALESCE(?, title),
          tagline            = COALESCE(?, tagline),
          description        = COALESCE(?, description),
          release_year       = COALESCE(?, release_year),
          runtime            = COALESCE(?, runtime),
          status             = COALESCE(?, status),
          age_rating         = COALESCE(?, age_rating),
          origin_country     = COALESCE(?, origin_country),
          original_language  = COALESCE(?, original_language),
          budget             = COALESCE(?, budget),
          box_office         = COALESCE(?, box_office),
          rating_imdb        = COALESCE(?, rating_imdb),
          rating_rt          = COALESCE(?, rating_rt),
          rating_metacritic  = COALESCE(?, rating_metacritic),
          tmdb_id            = COALESCE(?, tmdb_id),
          imdb_id            = COALESCE(?, imdb_id),
          wikidata_id        = COALESCE(?, wikidata_id),
          letterboxd_id      = COALESCE(?, letterboxd_id),
          tmdb_poster_path   = COALESCE(?, tmdb_poster_path),
          tmdb_backdrop_path = COALESCE(?, tmdb_backdrop_path),
          tmdb_trailer_key   = COALESCE(?, tmdb_trailer_key),
          keywords           = COALESCE(?, keywords),
          image_source       = 'tmdb',
          updated_at         = datetime('now')
         WHERE id = ?`,
      ).run(
        payload.title ?? null,
        payload.tagline ?? null,
        payload.description ?? null,
        payload.release_year ?? null,
        payload.runtime ?? null,
        payload.status ?? null,
        payload.age_rating ?? null,
        payload.origin_country ?? null,
        payload.original_language ?? null,
        payload.budget ?? null,
        payload.box_office ?? null,
        payload.rating_imdb ?? null,
        payload.rating_rt ?? null,
        payload.rating_metacritic ?? null,
        payload.tmdb_id ?? null,
        payload.imdb_id ?? null,
        payload.wikidata_id ?? null,
        payload.letterboxd_id ?? null,
        payload.tmdb_poster_path ?? null,
        payload.tmdb_backdrop_path ?? null,
        payload.tmdb_trailer_key ?? null,
        payload.keywords ? JSON.stringify(payload.keywords) : null,
        existing.id,
      );
      movieId = existing.id;
      movieUuid = existing.uuid;
      action = "updated";
    } else {
      // Insert new
      const info = db
        .prepare(
          `INSERT INTO movies (
            uuid, title, tagline, description, release_year, runtime, status,
            age_rating, origin_country, original_language,
            budget, box_office, rating_imdb, rating_rt, rating_metacritic,
            tmdb_id, imdb_id, wikidata_id, letterboxd_id,
            tmdb_poster_path, tmdb_backdrop_path, tmdb_trailer_key,
            keywords, image_source
          ) VALUES (lower(hex(randomblob(16))),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          payload.title,
          payload.tagline ?? null,
          payload.description ?? null,
          payload.release_year ?? null,
          payload.runtime ?? null,
          payload.status ?? "released",
          payload.age_rating ?? null,
          payload.origin_country ?? null,
          payload.original_language ?? null,
          payload.budget ?? null,
          payload.box_office ?? null,
          payload.rating_imdb ?? null,
          payload.rating_rt ?? null,
          payload.rating_metacritic ?? null,
          payload.tmdb_id ?? null,
          payload.imdb_id ?? null,
          payload.wikidata_id ?? null,
          payload.letterboxd_id ?? null,
          payload.tmdb_poster_path ?? null,
          payload.tmdb_backdrop_path ?? null,
          payload.tmdb_trailer_key ?? null,
          payload.keywords ? JSON.stringify(payload.keywords) : null,
          "tmdb",
        );
      movieId = info.lastInsertRowid as number;
      const row = db.prepare(`SELECT uuid FROM movies WHERE id = ?`).get(movieId) as { uuid: string };
      movieUuid = row.uuid;
      action = "created";
    }

    // ── Relationships ────────────────────────────────────────────────────────

    // Genres — only overwrite if we have data
    if (payload.genre_slugs && payload.genre_slugs.length > 0) {
      db.prepare(`DELETE FROM movie_genres WHERE movie_id = ?`).run(movieId);
      payload.genre_slugs.forEach((slug) => {
        const gid = resolveGenreId(slug);
        if (gid) db.prepare(`INSERT OR IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?,?)`).run(movieId, gid);
        else console.warn(`[ingest:movie] Unknown genre slug: "${slug}"`);
      });
    }

    // Languages
    if (payload.language_codes && payload.language_codes.length > 0) {
      db.prepare(`DELETE FROM movie_languages WHERE movie_id = ?`).run(movieId);
      payload.language_codes.forEach((code) => {
        const lid = resolveLanguageId(code);
        if (lid) db.prepare(`INSERT OR IGNORE INTO movie_languages (movie_id, language_id) VALUES (?,?)`).run(movieId, lid);
        else console.warn(`[ingest:movie] Unknown language code: "${code}"`);
      });
    }

    // Cast
    if (payload.cast && payload.cast.length > 0) {
      db.prepare(`DELETE FROM movie_cast WHERE movie_id = ?`).run(movieId);
      payload.cast.forEach((c, i) => {
        const personId = upsertPerson({
          name: c.name,
          tmdb_id: c.tmdb_id,
          imdb_id: c.imdb_id,
          tmdb_profile_path: c.tmdb_profile_path,
        });
        db.prepare(
          `INSERT OR IGNORE INTO movie_cast (movie_id, person_id, role, character, display_order)
           VALUES (?, ?, ?, ?, ?)`,
        ).run(movieId, personId, c.role, c.character ?? null, c.display_order ?? i);
      });
    }

    // Companies
    if (payload.companies && payload.companies.length > 0) {
      db.prepare(`DELETE FROM movie_companies WHERE movie_id = ?`).run(movieId);
      payload.companies.forEach((c) => {
        const companyId = upsertCompany({ name: c.name, tmdb_id: c.tmdb_id, role: c.role });
        db.prepare(
          `INSERT OR IGNORE INTO movie_companies (movie_id, company_id, role) VALUES (?,?,?)`,
        ).run(movieId, companyId, c.role);
      });
    }

    return { action, id: movieId, uuid: movieUuid, title: payload.title, media_type: "movie" };
  })();
}

// ── TV Show ingestion ─────────────────────────────────────────────────────────

export function ingestTVShow(payload: PluginTVPayload, options?: { overwrite?: boolean }): IngestResult {
  const overwrite = options?.overwrite ?? true;

  return db.transaction((): IngestResult => {
    let existing: { id: number; uuid: string; title: string } | undefined;

    if (payload.tmdb_id) {
      existing = db
        .prepare(`SELECT id, uuid, title FROM tv_shows WHERE tmdb_id = ?`)
        .get(payload.tmdb_id) as typeof existing;
    }
    if (!existing && payload.imdb_id) {
      existing = db
        .prepare(`SELECT id, uuid, title FROM tv_shows WHERE imdb_id = ?`)
        .get(payload.imdb_id) as typeof existing;
    }
    if (!existing && payload.first_air_date) {
      const year = payload.first_air_date.substring(0, 4);
      existing = db
        .prepare(
          `SELECT id, uuid, title FROM tv_shows WHERE lower(title) = ? AND first_air_date LIKE ?`,
        )
        .get(payload.title.toLowerCase(), `${year}%`) as typeof existing;
    }

    let showId: number;
    let showUuid: string;
    let action: IngestResult["action"];

    if (existing) {
      if (!overwrite) {
        return { action: "skipped", id: existing.id, uuid: existing.uuid, title: existing.title, media_type: "tv" };
      }
      db.prepare(
        `UPDATE tv_shows SET
          title              = COALESCE(?, title),
          tagline            = COALESCE(?, tagline),
          description        = COALESCE(?, description),
          status             = COALESCE(?, status),
          first_air_date     = COALESCE(?, first_air_date),
          last_air_date      = COALESCE(?, last_air_date),
          network            = COALESCE(?, network),
          origin_country     = COALESCE(?, origin_country),
          original_language  = COALESCE(?, original_language),
          age_rating         = COALESCE(?, age_rating),
          episode_count      = COALESCE(?, episode_count),
          season_count       = COALESCE(?, season_count),
          runtime_per_episode= COALESCE(?, runtime_per_episode),
          budget             = COALESCE(?, budget),
          box_office         = COALESCE(?, box_office),
          rating_imdb        = COALESCE(?, rating_imdb),
          rating_rt          = COALESCE(?, rating_rt),
          rating_metacritic  = COALESCE(?, rating_metacritic),
          tmdb_id            = COALESCE(?, tmdb_id),
          imdb_id            = COALESCE(?, imdb_id),
          wikidata_id        = COALESCE(?, wikidata_id),
          tmdb_poster_path   = COALESCE(?, tmdb_poster_path),
          tmdb_backdrop_path = COALESCE(?, tmdb_backdrop_path),
          keywords           = COALESCE(?, keywords),
          image_source       = 'tmdb',
          updated_at         = datetime('now')
         WHERE id = ?`,
      ).run(
        payload.title ?? null,
        payload.tagline ?? null,
        payload.description ?? null,
        payload.status ?? null,
        payload.first_air_date ?? null,
        payload.last_air_date ?? null,
        payload.network ?? null,
        payload.origin_country ?? null,
        payload.original_language ?? null,
        payload.age_rating ?? null,
        payload.episode_count ?? null,
        payload.season_count ?? null,
        payload.runtime_per_episode ?? null,
        payload.budget ?? null,
        payload.box_office ?? null,
        payload.rating_imdb ?? null,
        payload.rating_rt ?? null,
        payload.rating_metacritic ?? null,
        payload.tmdb_id ?? null,
        payload.imdb_id ?? null,
        payload.wikidata_id ?? null,
        payload.tmdb_poster_path ?? null,
        payload.tmdb_backdrop_path ?? null,
        payload.keywords ? JSON.stringify(payload.keywords) : null,
        existing.id,
      );
      showId = existing.id;
      showUuid = existing.uuid;
      action = "updated";
    } else {
      const info = db
        .prepare(
          `INSERT INTO tv_shows (
            uuid, title, tagline, description, status, first_air_date, last_air_date,
            network, origin_country, original_language, age_rating,
            episode_count, season_count, runtime_per_episode,
            budget, box_office, rating_imdb, rating_rt, rating_metacritic,
            tmdb_id, imdb_id, wikidata_id,
            tmdb_poster_path, tmdb_backdrop_path,
            keywords, image_source
          ) VALUES (lower(hex(randomblob(16))),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          payload.title,
          payload.tagline ?? null,
          payload.description ?? null,
          payload.status ?? "returning_series",
          payload.first_air_date ?? null,
          payload.last_air_date ?? null,
          payload.network ?? null,
          payload.origin_country ?? null,
          payload.original_language ?? null,
          payload.age_rating ?? null,
          payload.episode_count ?? 0,
          payload.season_count ?? 0,
          payload.runtime_per_episode ?? null,
          payload.budget ?? null,
          payload.box_office ?? null,
          payload.rating_imdb ?? null,
          payload.rating_rt ?? null,
          payload.rating_metacritic ?? null,
          payload.tmdb_id ?? null,
          payload.imdb_id ?? null,
          payload.wikidata_id ?? null,
          payload.tmdb_poster_path ?? null,
          payload.tmdb_backdrop_path ?? null,
          payload.keywords ? JSON.stringify(payload.keywords) : null,
          "tmdb",
        );
      showId = info.lastInsertRowid as number;
      const row = db.prepare(`SELECT uuid FROM tv_shows WHERE id = ?`).get(showId) as { uuid: string };
      showUuid = row.uuid;
      action = "created";
    }

    if (payload.genre_slugs && payload.genre_slugs.length > 0) {
      db.prepare(`DELETE FROM tv_genres WHERE show_id = ?`).run(showId);
      payload.genre_slugs.forEach((slug) => {
        const gid = resolveGenreId(slug);
        if (gid) db.prepare(`INSERT OR IGNORE INTO tv_genres (show_id, genre_id) VALUES (?,?)`).run(showId, gid);
        else console.warn(`[ingest:tv] Unknown genre slug: "${slug}"`);
      });
    }

    if (payload.language_codes && payload.language_codes.length > 0) {
      db.prepare(`DELETE FROM tv_languages WHERE show_id = ?`).run(showId);
      payload.language_codes.forEach((code) => {
        const lid = resolveLanguageId(code);
        if (lid) db.prepare(`INSERT OR IGNORE INTO tv_languages (show_id, language_id) VALUES (?,?)`).run(showId, lid);
        else console.warn(`[ingest:tv] Unknown language code: "${code}"`);
      });
    }

    if (payload.cast && payload.cast.length > 0) {
      db.prepare(`DELETE FROM tv_cast WHERE show_id = ?`).run(showId);
      payload.cast.forEach((c, i) => {
        const personId = upsertPerson({
          name: c.name,
          tmdb_id: c.tmdb_id,
          imdb_id: c.imdb_id,
          tmdb_profile_path: c.tmdb_profile_path,
        });
        db.prepare(
          `INSERT OR IGNORE INTO tv_cast (show_id, person_id, role, character, display_order)
           VALUES (?, ?, ?, ?, ?)`,
        ).run(showId, personId, c.role, c.character ?? null, c.display_order ?? i);
      });
    }

    if (payload.companies && payload.companies.length > 0) {
      db.prepare(`DELETE FROM tv_companies WHERE show_id = ?`).run(showId);
      payload.companies.forEach((c) => {
        const companyId = upsertCompany({ name: c.name, tmdb_id: c.tmdb_id, role: c.role });
        db.prepare(
          `INSERT OR IGNORE INTO tv_companies (show_id, company_id, role) VALUES (?,?,?)`,
        ).run(showId, companyId, c.role);
      });
    }

    return { action, id: showId, uuid: showUuid, title: payload.title, media_type: "tv" };
  })();
}
