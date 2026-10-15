/**
 * ingester.ts
 *
 * Core ingestion engine. Accepts normalized PluginMoviePayload / PluginTVPayload
 * and upserts into the DB. Handles resolution of genres, languages, people, companies.
 *
 * This is the single source of truth for all data writes from external providers.
 */

import db, {
  movies as moviesTable,
  tvShows as tvShowsTable,
  genres as genresTable,
  languages as languagesTable,
  people as peopleTable,
  companies as companiesTable,
  movieGenres as movieGenresTable,
  tvGenres as tvGenresTable,
  movieLanguages as movieLanguagesTable,
  tvLanguages as tvLanguagesTable,
  movieCast as movieCastTable,
  tvCast as tvCastTable,
  movieCompanies as movieCompaniesTable,
  tvCompanies as tvCompaniesTable,
} from "../db";
import { eq, or, and, sql, like } from "drizzle-orm";
import type {
  PluginMoviePayload,
  PluginTVPayload,
  IngestResult,
} from "shared-types";

// ── Lookup helpers ────────────────────────────────────────────────────────────

function resolveGenreId(slug: string): number | null {
  const row = db
    .select({ id: genresTable.id })
    .from(genresTable)
    .where(
      or(
        eq(genresTable.slug, slug.toLowerCase()),
        sql`lower(${genresTable.name}) = ${slug.toLowerCase()}`
      )
    )
    .get();
  return row?.id ?? null;
}

function resolveLanguageId(code: string): number | null {
  const row = db
    .select({ id: languagesTable.id })
    .from(languagesTable)
    .where(eq(languagesTable.code, code.toLowerCase()))
    .get();
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
      .select({ id: peopleTable.id })
      .from(peopleTable)
      .where(eq(peopleTable.tmdb_id, params.tmdb_id))
      .get();
    if (existing) {
      if (params.tmdb_profile_path) {
        db.update(peopleTable)
          .set({ tmdb_profile_path: params.tmdb_profile_path })
          .where(eq(peopleTable.id, existing.id))
          .run();
      }
      return existing.id;
    }
  }

  const byName = db
    .select({ id: peopleTable.id })
    .from(peopleTable)
    .where(sql`lower(${peopleTable.name}) = lower(${params.name})`)
    .get();
  if (byName) {
    if (params.tmdb_id || params.imdb_id || params.tmdb_profile_path) {
      db.update(peopleTable)
        .set({
          tmdb_id: params.tmdb_id ? params.tmdb_id : undefined,
          imdb_id: params.imdb_id ? params.imdb_id : undefined,
          tmdb_profile_path: params.tmdb_profile_path ? params.tmdb_profile_path : undefined,
        })
        .where(eq(peopleTable.id, byName.id))
        .run();
    }
    return byName.id;
  }

  // Create new person
  const info = db
    .insert(peopleTable)
    .values({
      name: params.name.trim(),
      tmdb_id: params.tmdb_id ?? null,
      imdb_id: params.imdb_id ?? null,
      tmdb_profile_path: params.tmdb_profile_path ?? null,
    })
    .run();
  return Number(info.lastInsertRowid);
}

function upsertCompany(params: {
  name: string;
  tmdb_id?: number;
  role: string;
}): number {
  if (params.tmdb_id) {
    const existing = db
      .select({ id: companiesTable.id })
      .from(companiesTable)
      .where(eq(companiesTable.tmdb_id, params.tmdb_id))
      .get();
    if (existing) return existing.id;
  }

  const byName = db
    .select({ id: companiesTable.id })
    .from(companiesTable)
    .where(sql`lower(${companiesTable.name}) = lower(${params.name})`)
    .get();
  if (byName) return byName.id;

  const info = db
    .insert(companiesTable)
    .values({
      name: params.name.trim(),
      tmdb_id: params.tmdb_id ?? null,
      type: params.role,
    })
    .run();
  return Number(info.lastInsertRowid);
}

// ── Movie ingestion ───────────────────────────────────────────────────────────

export function ingestMovie(payload: PluginMoviePayload, options?: { overwrite?: boolean }): IngestResult {
  const overwrite = options?.overwrite ?? true;

  return db.transaction((): IngestResult => {
    // Check for existing by tmdb_id or title+year
    let existing: { id: number; uuid: string; title: string } | undefined;

    if (payload.tmdb_id) {
      existing = db
        .select({ id: moviesTable.id, uuid: moviesTable.uuid, title: moviesTable.title })
        .from(moviesTable)
        .where(eq(moviesTable.tmdb_id, payload.tmdb_id))
        .get() as typeof existing;
    }
    if (!existing && payload.imdb_id) {
      existing = db
        .select({ id: moviesTable.id, uuid: moviesTable.uuid, title: moviesTable.title })
        .from(moviesTable)
        .where(eq(moviesTable.imdb_id, payload.imdb_id))
        .get() as typeof existing;
    }
    if (!existing && payload.release_year) {
      existing = db
        .select({ id: moviesTable.id, uuid: moviesTable.uuid, title: moviesTable.title })
        .from(moviesTable)
        .where(
          and(
            sql`lower(${moviesTable.title}) = lower(${payload.title})`,
            eq(moviesTable.release_year, payload.release_year)
          )
        )
        .get() as typeof existing;
    }

    let movieId: number;
    let movieUuid: string;
    let action: IngestResult["action"];

    if (existing) {
      if (!overwrite) {
        return { action: "skipped", id: existing.id, uuid: existing.uuid, title: existing.title, media_type: "movie" };
      }
      // Update existing row
      db.update(moviesTable)
        .set({
          title: payload.title ?? undefined,
          tagline: payload.tagline ?? undefined,
          description: payload.description ?? undefined,
          release_year: payload.release_year ?? undefined,
          runtime: payload.runtime ?? undefined,
          status: payload.status ?? undefined,
          age_rating: payload.age_rating ?? undefined,
          origin_country: payload.origin_country ?? undefined,
          original_language: payload.original_language ?? undefined,
          budget: payload.budget ?? undefined,
          box_office: payload.box_office ?? undefined,
          rating_imdb: payload.rating_imdb ?? undefined,
          rating_rt: payload.rating_rt ?? undefined,
          rating_metacritic: payload.rating_metacritic ?? undefined,
          tmdb_id: payload.tmdb_id ?? undefined,
          imdb_id: payload.imdb_id ?? undefined,
          wikidata_id: payload.wikidata_id ?? undefined,
          letterboxd_id: payload.letterboxd_id ?? undefined,
          tmdb_poster_path: payload.tmdb_poster_path ?? undefined,
          tmdb_backdrop_path: payload.tmdb_backdrop_path ?? undefined,
          tmdb_trailer_key: payload.tmdb_trailer_key ?? undefined,
          keywords: payload.keywords ? JSON.stringify(payload.keywords) : undefined,
          image_source: "tmdb",
          updated_at: sql`datetime('now')`,
        })
        .where(eq(moviesTable.id, existing.id))
        .run();

      movieId = existing.id;
      movieUuid = existing.uuid;
      action = "updated";
    } else {
      // Insert new
      const info = db
        .insert(moviesTable)
        .values({
          uuid: sql`lower(hex(randomblob(16)))`,
          title: payload.title,
          tagline: payload.tagline ?? null,
          description: payload.description ?? null,
          release_year: payload.release_year ?? null,
          runtime: payload.runtime ?? null,
          status: payload.status ?? "released",
          age_rating: payload.age_rating ?? null,
          origin_country: payload.origin_country ?? null,
          original_language: payload.original_language ?? null,
          budget: payload.budget ?? null,
          box_office: payload.box_office ?? null,
          rating_imdb: payload.rating_imdb ?? null,
          rating_rt: payload.rating_rt ?? null,
          rating_metacritic: payload.rating_metacritic ?? null,
          tmdb_id: payload.tmdb_id ?? null,
          imdb_id: payload.imdb_id ?? null,
          wikidata_id: payload.wikidata_id ?? null,
          letterboxd_id: payload.letterboxd_id ?? null,
          tmdb_poster_path: payload.tmdb_poster_path ?? null,
          tmdb_backdrop_path: payload.tmdb_backdrop_path ?? null,
          tmdb_trailer_key: payload.tmdb_trailer_key ?? null,
          keywords: payload.keywords ? JSON.stringify(payload.keywords) : null,
          image_source: "tmdb",
        })
        .run();

      movieId = Number(info.lastInsertRowid);
      const row = db
        .select({ uuid: moviesTable.uuid })
        .from(moviesTable)
        .where(eq(moviesTable.id, movieId))
        .get();
      movieUuid = row!.uuid!;
      action = "created";
    }

    // ── Relationships ────────────────────────────────────────────────────────

    // Genres — only overwrite if we have data
    if (payload.genre_slugs && payload.genre_slugs.length > 0) {
      db.delete(movieGenresTable).where(eq(movieGenresTable.movie_id, movieId)).run();
      payload.genre_slugs.forEach((slug) => {
        const gid = resolveGenreId(slug);
        if (gid)
          db.insert(movieGenresTable)
            .values({ movie_id: movieId, genre_id: gid })
            .onConflictDoNothing()
            .run();
        else console.warn(`[ingest:movie] Unknown genre slug: "${slug}"`);
      });
    }

    // Languages
    if (payload.language_codes && payload.language_codes.length > 0) {
      db.delete(movieLanguagesTable).where(eq(movieLanguagesTable.movie_id, movieId)).run();
      payload.language_codes.forEach((code) => {
        const lid = resolveLanguageId(code);
        if (lid)
          db.insert(movieLanguagesTable)
            .values({ movie_id: movieId, language_id: lid })
            .onConflictDoNothing()
            .run();
        else console.warn(`[ingest:movie] Unknown language code: "${code}"`);
      });
    }

    // Cast
    if (payload.cast && payload.cast.length > 0) {
      db.delete(movieCastTable).where(eq(movieCastTable.movie_id, movieId)).run();
      payload.cast.forEach((c, i) => {
        const personId = upsertPerson({
          name: c.name,
          tmdb_id: c.tmdb_id,
          imdb_id: c.imdb_id,
          tmdb_profile_path: c.tmdb_profile_path,
        });
        db.insert(movieCastTable)
          .values({
            movie_id: movieId,
            person_id: personId,
            role: c.role,
            character: c.character ?? null,
            display_order: c.display_order ?? i,
          })
          .onConflictDoNothing()
          .run();
      });
    }

    // Companies
    if (payload.companies && payload.companies.length > 0) {
      db.delete(movieCompaniesTable).where(eq(movieCompaniesTable.movie_id, movieId)).run();
      payload.companies.forEach((c) => {
        const companyId = upsertCompany({ name: c.name, tmdb_id: c.tmdb_id, role: c.role });
        db.insert(movieCompaniesTable)
          .values({
            movie_id: movieId,
            company_id: companyId,
            role: c.role,
          })
          .onConflictDoNothing()
          .run();
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
        .select({ id: tvShowsTable.id, uuid: tvShowsTable.uuid, title: tvShowsTable.title })
        .from(tvShowsTable)
        .where(eq(tvShowsTable.tmdb_id, payload.tmdb_id))
        .get() as typeof existing;
    }
    if (!existing && payload.imdb_id) {
      existing = db
        .select({ id: tvShowsTable.id, uuid: tvShowsTable.uuid, title: tvShowsTable.title })
        .from(tvShowsTable)
        .where(eq(tvShowsTable.imdb_id, payload.imdb_id))
        .get() as typeof existing;
    }
    if (!existing && payload.first_air_date) {
      const year = payload.first_air_date.substring(0, 4);
      existing = db
        .select({ id: tvShowsTable.id, uuid: tvShowsTable.uuid, title: tvShowsTable.title })
        .from(tvShowsTable)
        .where(
          and(
            sql`lower(${tvShowsTable.title}) = lower(${payload.title})`,
            like(tvShowsTable.first_air_date, `${year}%`)
          )
        )
        .get() as typeof existing;
    }

    let showId: number;
    let showUuid: string;
    let action: IngestResult["action"];

    if (existing) {
      if (!overwrite) {
        return { action: "skipped", id: existing.id, uuid: existing.uuid, title: existing.title, media_type: "tv" };
      }
      db.update(tvShowsTable)
        .set({
          title: payload.title ?? undefined,
          tagline: payload.tagline ?? undefined,
          description: payload.description ?? undefined,
          status: payload.status ?? undefined,
          first_air_date: payload.first_air_date ?? undefined,
          last_air_date: payload.last_air_date ?? undefined,
          network: payload.network ?? undefined,
          origin_country: payload.origin_country ?? undefined,
          original_language: payload.original_language ?? undefined,
          age_rating: payload.age_rating ?? undefined,
          episode_count: payload.episode_count ?? undefined,
          season_count: payload.season_count ?? undefined,
          runtime_per_episode: payload.runtime_per_episode ?? undefined,
          budget: payload.budget ?? undefined,
          box_office: payload.box_office ?? undefined,
          rating_imdb: payload.rating_imdb ?? undefined,
          rating_rt: payload.rating_rt ?? undefined,
          rating_metacritic: payload.rating_metacritic ?? undefined,
          tmdb_id: payload.tmdb_id ?? undefined,
          imdb_id: payload.imdb_id ?? undefined,
          wikidata_id: payload.wikidata_id ?? undefined,
          tmdb_poster_path: payload.tmdb_poster_path ?? undefined,
          tmdb_backdrop_path: payload.tmdb_backdrop_path ?? undefined,
          keywords: payload.keywords ? JSON.stringify(payload.keywords) : undefined,
          image_source: "tmdb",
          updated_at: sql`datetime('now')`,
        })
        .where(eq(tvShowsTable.id, existing.id))
        .run();

      showId = existing.id;
      showUuid = existing.uuid;
      action = "updated";
    } else {
      const info = db
        .insert(tvShowsTable)
        .values({
          uuid: sql`lower(hex(randomblob(16)))`,
          title: payload.title,
          tagline: payload.tagline ?? null,
          description: payload.description ?? null,
          status: payload.status ?? "returning_series",
          first_air_date: payload.first_air_date ?? null,
          last_air_date: payload.last_air_date ?? null,
          network: payload.network ?? null,
          origin_country: payload.origin_country ?? null,
          original_language: payload.original_language ?? null,
          age_rating: payload.age_rating ?? null,
          episode_count: payload.episode_count ?? 0,
          season_count: payload.season_count ?? 0,
          runtime_per_episode: payload.runtime_per_episode ?? null,
          budget: payload.budget ?? null,
          box_office: payload.box_office ?? null,
          rating_imdb: payload.rating_imdb ?? null,
          rating_rt: payload.rating_rt ?? null,
          rating_metacritic: payload.rating_metacritic ?? null,
          tmdb_id: payload.tmdb_id ?? null,
          imdb_id: payload.imdb_id ?? null,
          wikidata_id: payload.wikidata_id ?? null,
          tmdb_poster_path: payload.tmdb_poster_path ?? null,
          tmdb_backdrop_path: payload.tmdb_backdrop_path ?? null,
          keywords: payload.keywords ? JSON.stringify(payload.keywords) : null,
          image_source: "tmdb",
        })
        .run();

      showId = Number(info.lastInsertRowid);
      const row = db
        .select({ uuid: tvShowsTable.uuid })
        .from(tvShowsTable)
        .where(eq(tvShowsTable.id, showId))
        .get();
      showUuid = row!.uuid!;
      action = "created";
    }

    if (payload.genre_slugs && payload.genre_slugs.length > 0) {
      db.delete(tvGenresTable).where(eq(tvGenresTable.show_id, showId)).run();
      payload.genre_slugs.forEach((slug) => {
        const gid = resolveGenreId(slug);
        if (gid)
          db.insert(tvGenresTable)
            .values({ show_id: showId, genre_id: gid })
            .onConflictDoNothing()
            .run();
        else console.warn(`[ingest:tv] Unknown genre slug: "${slug}"`);
      });
    }

    if (payload.language_codes && payload.language_codes.length > 0) {
      db.delete(tvLanguagesTable).where(eq(tvLanguagesTable.show_id, showId)).run();
      payload.language_codes.forEach((code) => {
        const lid = resolveLanguageId(code);
        if (lid)
          db.insert(tvLanguagesTable)
            .values({ show_id: showId, language_id: lid })
            .onConflictDoNothing()
            .run();
        else console.warn(`[ingest:tv] Unknown language code: "${code}"`);
      });
    }

    if (payload.cast && payload.cast.length > 0) {
      db.delete(tvCastTable).where(eq(tvCastTable.show_id, showId)).run();
      payload.cast.forEach((c, i) => {
        const personId = upsertPerson({
          name: c.name,
          tmdb_id: c.tmdb_id,
          imdb_id: c.imdb_id,
          tmdb_profile_path: c.tmdb_profile_path,
        });
        db.insert(tvCastTable)
          .values({
            show_id: showId,
            person_id: personId,
            role: c.role,
            character: c.character ?? null,
            display_order: c.display_order ?? i,
          })
          .onConflictDoNothing()
          .run();
      });
    }

    if (payload.companies && payload.companies.length > 0) {
      db.delete(tvCompaniesTable).where(eq(tvCompaniesTable.show_id, showId)).run();
      payload.companies.forEach((c) => {
        const companyId = upsertCompany({ name: c.name, tmdb_id: c.tmdb_id, role: c.role });
        db.insert(tvCompaniesTable)
          .values({
            show_id: showId,
            company_id: companyId,
            role: c.role,
          })
          .onConflictDoNothing()
          .run();
      });
    }

    return { action, id: showId, uuid: showUuid, title: payload.title, media_type: "tv" };
  })();
}
