import { Hono } from "hono";
import db, {
  tvShows as tvShowsTable,
  tvSeasons as tvSeasonsTable,
  tvEpisodes as tvEpisodesTable,
  tvLanguages as tvLanguagesTable,
  tvGenres as tvGenresTable,
  tvCast as tvCastTable,
  tvCompanies as tvCompaniesTable,
  people as peopleTable,
  companies as companiesTable,
  languages as languagesTable,
  genres as genresTable,
  watchlist as watchlistTable,
} from "../db";
import { eq, and, ne, inArray, desc, asc, sql, like } from "drizzle-orm";
import type {
  TVShowCard,
  TVShow,
  TVShowWithDetails,
  Language,
  Genre,
  CastMember,
  Company,
  TVSeason,
  TVEpisode,
  CreateTVShowRequest,
  UpdateTVShowRequest,
  CastMemberRequest,
  CompanyRequest,
} from "shared-types";
import { resolveImage } from "../utils/imageUtils";
import { getShowWatchlistSet } from "../utils/watchlistCache";
import { getTrendingTV, getPopularTV } from "../services/feedRanking";
import { getTvBlockCondition } from "../utils/preferences";
import { clean } from "../utils/stringUtils";
import { getErrorMessage } from "../utils/errors";
import { requireAuth, requireModerator, optionalAuth } from "../middleware/authMiddleware";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

const tvCardSelection = {
  id: tvShowsTable.id,
  uuid: tvShowsTable.uuid,
  title: tvShowsTable.title,
  status: tvShowsTable.status,
  first_air_date: tvShowsTable.first_air_date,
  poster_url: tvShowsTable.poster_url,
  backdrop_url: tvShowsTable.backdrop_url,
  tmdb_id: tvShowsTable.tmdb_id,
  tmdb_poster_path: tvShowsTable.tmdb_poster_path,
  tmdb_backdrop_path: tvShowsTable.tmdb_backdrop_path,
  description: tvShowsTable.description,
  tagline: tvShowsTable.tagline,
  rating_imdb: tvShowsTable.rating_imdb,
  episode_count: tvShowsTable.episode_count,
};

function getWatchlistSet(userId?: string): Set<number> {
  return getShowWatchlistSet(userId);
}

function toTVShowCards(shows: TVShow[], watchlistSet: Set<number>): TVShowCard[] {
  if (shows.length === 0) return [];
  const ids = shows.map((s) => s.id);

  const allGenres = db
    .select({
      show_id: tvGenresTable.show_id,
      id: genresTable.id,
      name: genresTable.name,
      slug: genresTable.slug,
    })
    .from(genresTable)
    .innerJoin(tvGenresTable, eq(genresTable.id, tvGenresTable.genre_id))
    .where(inArray(tvGenresTable.show_id, ids))
    .all();

  const genreMap = new Map<number, { id: number; name: string; slug: string }[]>();
  allGenres.forEach(({ show_id, ...g }) => {
    if (!genreMap.has(show_id)) genreMap.set(show_id, []);
    genreMap.get(show_id)!.push(g);
  });

  return shows.map((s) => ({
    id: s.id,
    uuid: s.uuid,
    type: "tv",
    title: s.title,
    poster_url: resolveImage(s.tmdb_poster_path, null) || s.poster_url,
    backdrop_url: resolveImage(s.tmdb_backdrop_path, null, "w780") || s.backdrop_url,
    release_year: s.first_air_date ? parseInt(s.first_air_date.substring(0, 4)) : undefined,
    status: s.status ?? "returning_series",
    tmdb_id: s.tmdb_id,
    in_watchlist: watchlistSet.has(s.id),
    genres: genreMap.get(s.id) ?? [],
    description: s.description,
    tagline: s.tagline,
  }));
}

function getTVShowWithDetails(identifier: string | number, userId?: string): TVShowWithDetails | undefined {
  const isUuid = typeof identifier === "string";
  const show = db
    .select()
    .from(tvShowsTable)
    .where(isUuid ? eq(tvShowsTable.uuid, identifier as string) : eq(tvShowsTable.id, identifier as number))
    .get() as TVShow | undefined;

  if (!show) return undefined;
  const id = show.id;

  let inWatchlist = false;
  if (userId) {
    const wl = db
      .select({ id: watchlistTable.id })
      .from(watchlistTable)
      .where(and(eq(watchlistTable.show_id, id), eq(watchlistTable.user_id, userId)))
      .get();
    inWatchlist = !!wl;
  }

  const languages = db
    .select({
      id: languagesTable.id,
      name: languagesTable.name,
      code: languagesTable.code,
      native_script: languagesTable.native_script,
    })
    .from(languagesTable)
    .innerJoin(tvLanguagesTable, eq(languagesTable.id, tvLanguagesTable.language_id))
    .where(eq(tvLanguagesTable.show_id, id))
    .all() as Language[];

  const genres = db
    .select({
      id: genresTable.id,
      name: genresTable.name,
      slug: genresTable.slug,
      description: genresTable.description,
      created_at: genresTable.created_at,
    })
    .from(genresTable)
    .innerJoin(tvGenresTable, eq(genresTable.id, tvGenresTable.genre_id))
    .where(eq(tvGenresTable.show_id, id))
    .all() as Genre[];

  const cast = db
    .select({
      id: peopleTable.id,
      name: peopleTable.name,
      also_known_as: peopleTable.also_known_as,
      profile_url: peopleTable.profile_url,
      tmdb_id: peopleTable.tmdb_id,
      imdb_id: peopleTable.imdb_id,
      tmdb_profile_path: peopleTable.tmdb_profile_path,
      local_profile_url: peopleTable.local_profile_url,
      role: tvCastTable.role,
      character: tvCastTable.character,
      display_order: tvCastTable.display_order,
    })
    .from(peopleTable)
    .innerJoin(tvCastTable, eq(peopleTable.id, tvCastTable.person_id))
    .where(eq(tvCastTable.show_id, id))
    .orderBy(asc(tvCastTable.display_order), asc(tvCastTable.role))
    .all() as CastMember[];

  const companies = db
    .select({
      id: companiesTable.id,
      name: companiesTable.name,
      type: companiesTable.type,
      logo_url: companiesTable.logo_url,
      country: companiesTable.country,
      tmdb_id: companiesTable.tmdb_id,
      tmdb_logo_path: companiesTable.tmdb_logo_path,
      role: tvCompaniesTable.role,
    })
    .from(companiesTable)
    .innerJoin(tvCompaniesTable, eq(companiesTable.id, tvCompaniesTable.company_id))
    .where(eq(tvCompaniesTable.show_id, id))
    .orderBy(asc(companiesTable.name))
    .all() as (Company & { role: string })[];

  const seasons = db
    .select()
    .from(tvSeasonsTable)
    .where(eq(tvSeasonsTable.show_id, id))
    .orderBy(asc(tvSeasonsTable.season_number))
    .all() as TVSeason[];

  return {
    ...show,
    keywords: show.keywords ? JSON.parse(show.keywords as unknown as string) : undefined,
    poster_url: resolveImage(show.tmdb_poster_path, null) || show.poster_url,
    backdrop_url: resolveImage(show.tmdb_backdrop_path, null, "original") || show.backdrop_url,
    in_watchlist: inWatchlist,
    languages,
    genres,
    cast: cast.map((c) => ({
      ...c,
      profile_url: resolveImage(c.tmdb_profile_path, c.local_profile_url, "w185") || c.profile_url,
    })),
    companies: companies.map((c) => ({
      ...c,
      logo_url: resolveImage(c.tmdb_logo_path, null, "w185") || c.logo_url,
    })),
    seasons: seasons.map((s) => ({
      ...s,
      poster_url: resolveImage(s.tmdb_poster_path, null) || s.poster_url,
    })),
  };
}

function upsertPerson(req: CastMemberRequest): number {
  if (req.person_id) return req.person_id;
  const existing = db
    .select({ id: peopleTable.id })
    .from(peopleTable)
    .where(sql`lower(${peopleTable.name}) = lower(${req.name})`)
    .get();
  if (existing) return existing.id;
  const info = db
    .insert(peopleTable)
    .values({
      name: req.name.trim(),
      profile_url: req.profile_url ?? null,
      tmdb_id: req.tmdb_id ?? null,
      imdb_id: req.imdb_id ?? null,
    })
    .run();
  return Number(info.lastInsertRowid);
}

function upsertCompany(req: CompanyRequest): number {
  if (req.company_id) return req.company_id;
  const existing = db
    .select({ id: companiesTable.id })
    .from(companiesTable)
    .where(sql`lower(${companiesTable.name}) = lower(${req.name})`)
    .get();
  if (existing) return existing.id;
  const info = db
    .insert(companiesTable)
    .values({
      name: req.name.trim(),
      type: req.type ?? "production",
      logo_url: req.logo_url ?? null,
      country: req.country ?? null,
    })
    .run();
  return Number(info.lastInsertRowid);
}

// ── GET /tv/recent ────────────────────────────────────────────────────────────
router.get("/recent", optionalAuth, (c) => {
  try {
    const user = c.get("user");
    const shows = db
      .select(tvCardSelection)
      .from(tvShowsTable)
      .orderBy(desc(tvShowsTable.first_air_date))
      .limit(20)
      .all() as unknown as TVShow[];
    const cards = toTVShowCards(shows, getWatchlistSet(user?.id));
    c.header("Cache-Control", "public, max-age=300");
    return c.json({ success: true, data: cards });
  } catch (err: unknown) {
    return c.json({ success: false, error: "Failed to fetch recent TV shows", message: getErrorMessage(err) }, 500);
  }
});

// ── GET /tv/top-rated ─────────────────────────────────────────────────────────
router.get("/top-rated", optionalAuth, (c) => {
  try {
    const user = c.get("user");
    const shows = db
      .select(tvCardSelection)
      .from(tvShowsTable)
      .orderBy(sql`${tvShowsTable.rating_imdb} desc nulls last`, asc(tvShowsTable.title))
      .limit(20)
      .all() as unknown as TVShow[];
    const cards = toTVShowCards(shows, getWatchlistSet(user?.id));
    c.header("Cache-Control", "public, max-age=300");
    return c.json({ success: true, data: cards });
  } catch (err: unknown) {
    return c.json({ success: false, error: "Failed to fetch top-rated TV shows", message: getErrorMessage(err) }, 500);
  }
});

// ── GET /tv/trending ──────────────────────────────────────────────────────────
router.get("/trending", optionalAuth, async (c) => {
  try {
    const user = c.get("user");
    const blockCond = getTvBlockCondition(user?.id);
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") as string) || 20));

    const cards = await getTrendingTV(limit, blockCond, user?.id);
    c.header("Cache-Control", user ? "private, max-age=60" : "public, max-age=300");
    return c.json({ success: true, data: cards });
  } catch (err: unknown) {
    return c.json({
      success: false,
      error: "Failed to fetch trending TV shows",
      message: getErrorMessage(err),
    }, 500);
  }
});

// ── GET /tv/popular ───────────────────────────────────────────────────────────
router.get("/popular", optionalAuth, async (c) => {
  try {
    const user = c.get("user");
    const blockCond = getTvBlockCondition(user?.id);
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") as string) || 20));

    const cards = await getPopularTV(limit, blockCond, user?.id);
    c.header("Cache-Control", user ? "private, max-age=60" : "public, max-age=300");
    return c.json({ success: true, data: cards });
  } catch (err: unknown) {
    return c.json({
      success: false,
      error: "Failed to fetch popular TV shows",
      message: getErrorMessage(err),
    }, 500);
  }
});

// ── GET /tv/hot ───────────────────────────────────────────────────────────────
// Legacy alias for /tv/trending
router.get("/hot", optionalAuth, async (c) => {
  try {
    const user = c.get("user");
    const blockCond = getTvBlockCondition(user?.id);
    const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") as string) || 20));

    const cards = await getTrendingTV(limit, blockCond, user?.id);
    c.header("Cache-Control", user ? "private, max-age=60" : "public, max-age=300");
    return c.json({ success: true, data: cards });
  } catch (err: unknown) {
    return c.json({
      success: false,
      error: "Failed to fetch hot TV shows",
      message: getErrorMessage(err),
    }, 500);
  }
});

// ── GET /tv/completed ───────────────────────────────────────────────────────
router.get("/completed", optionalAuth, (c) => {
  try {
    const user = c.get("user");
    const shows = db
      .select(tvCardSelection)
      .from(tvShowsTable)
      .where(eq(tvShowsTable.status, "ended"))
      .orderBy(sql`${tvShowsTable.rating_imdb} desc nulls last`)
      .limit(20)
      .all() as unknown as TVShow[];
    const cards = toTVShowCards(shows, getWatchlistSet(user?.id));
    c.header("Cache-Control", "public, max-age=300");
    return c.json({ success: true, data: cards });
  } catch (err: unknown) {
    return c.json({ success: false, error: "Failed to fetch completed TV shows", message: getErrorMessage(err) }, 500);
  }
});

// ── GET /tv ───────────────────────────────────────────────────────────────────
router.get("/", optionalAuth, (c) => {
  try {
    const user = c.get("user");
    const search = c.req.query("search");
    let query = db.select(tvCardSelection).from(tvShowsTable).$dynamic();

    if (search?.trim()) {
      query = query.where(like(tvShowsTable.title, `%${search.trim()}%`));
    }

    const shows = query
      .orderBy(asc(tvShowsTable.title))
      .limit(50)
      .all() as unknown as TVShow[];
    const cards = toTVShowCards(shows, getWatchlistSet(user?.id));
    return c.json({ success: true, data: cards });
  } catch (err: unknown) {
    return c.json({ success: false, error: "Failed to fetch TV shows", message: getErrorMessage(err) }, 500);
  }
});

// ── GET /tv/:uuid/similar ──────────────────────────────────────────────────────
// Declared BEFORE /:uuid
router.get("/:uuid/similar", (c) => {
  try {
    const uuid = c.req.param("uuid");

    const show = db
      .select({ id: tvShowsTable.id })
      .from(tvShowsTable)
      .where(eq(tvShowsTable.uuid, uuid))
      .get();
    if (!show) return c.json({ success: false, error: "TV Show not found" }, 404);

    const genreSubquery = db
      .select({ genre_id: tvGenresTable.genre_id })
      .from(tvGenresTable)
      .where(eq(tvGenresTable.show_id, show.id));

    const similar = db
      .select({
        ...tvCardSelection,
        shared_genres: sql<number>`count(${tvGenresTable.genre_id})`.as("shared_genres"),
      })
      .from(tvShowsTable)
      .innerJoin(tvGenresTable, eq(tvShowsTable.id, tvGenresTable.show_id))
      .where(
        and(
          inArray(tvGenresTable.genre_id, genreSubquery),
          ne(tvShowsTable.id, show.id)
        )
      )
      .groupBy(tvShowsTable.id)
      .orderBy(sql`shared_genres desc`, desc(tvShowsTable.first_air_date))
      .limit(15)
      .all() as unknown as TVShow[];

    const cards = toTVShowCards(similar, getWatchlistSet(c.get("user")?.id));
    return c.json({ success: true, data: cards });
  } catch (err: unknown) {
    return c.json({ success: false, error: "Failed to fetch similar tv shows", message: getErrorMessage(err) }, 500);
  }
});

// ── GET /tv/:uuid/seasons/:seasonId/episodes ──────────────────────────────
router.get("/:uuid/seasons/:seasonId/episodes", (c) => {
  try {
    const seasonId = parseInt(c.req.param("seasonId"));
    if (isNaN(seasonId)) {
      return c.json({ success: false, error: "Invalid season ID" }, 400);
    }
    const episodes = db
      .select()
      .from(tvEpisodesTable)
      .where(eq(tvEpisodesTable.season_id, seasonId))
      .orderBy(asc(tvEpisodesTable.episode_number))
      .all() as TVEpisode[];

    const mapped = episodes.map((e) => ({
      ...e,
      still_url: resolveImage(e.tmdb_still_path, null, "w300") || e.still_url,
    }));

    return c.json({ success: true, data: mapped });
  } catch (err: unknown) {
    return c.json({ success: false, error: "Failed to fetch episodes", message: getErrorMessage(err) }, 500);
  }
});

// ── GET /tv/:uuid ──────────────────────────────────────────────────────────────
router.get("/:uuid", optionalAuth, (c) => {
  try {
    const user = c.get("user");
    const uuid = c.req.param("uuid");
    const showWithDetails = getTVShowWithDetails(uuid, user?.id);

    if (!showWithDetails) {
      return c.json({ success: false, error: "TV Show not found" }, 404);
    }

    return c.json({ success: true, data: showWithDetails });
  } catch (err: unknown) {
    return c.json({ success: false, error: "Failed to fetch TV show", message: getErrorMessage(err) }, 500);
  }
});

// ── POST /tv ───────────────────────────────────────────────────────────────────
router.post("/", requireAuth, async (c) => {
  try {
    const body = await c.req.json<CreateTVShowRequest>().catch(() => ({} as CreateTVShowRequest));
    if (!body.title?.trim())
      return c.json({ success: false, error: "Title is required" }, 400);

    const result = db.transaction(() => {
      const info = db
        .insert(tvShowsTable)
        .values({
          uuid: sql`lower(hex(randomblob(16)))`,
          title: body.title.trim(),
          tagline: clean(body.tagline),
          description: body.description?.trim() ?? "",
          status: body.status ?? "returning_series",
          first_air_date: body.first_air_date ?? null,
          last_air_date: body.last_air_date ?? null,
          network: clean(body.network),
          origin_country: clean(body.origin_country),
          original_language: clean(body.original_language),
          age_rating: clean(body.age_rating),
          imdb_id: clean(body.imdb_id),
          tmdb_id: body.tmdb_id ?? null,
          letterboxd_id: clean(body.letterboxd_id),
          wikidata_id: clean(body.wikidata_id),
          poster_url: clean(body.poster_url),
          backdrop_url: clean(body.backdrop_url),
          budget: body.budget ?? null,
          box_office: body.box_office ?? null,
          rating_imdb: body.rating_imdb ?? null,
          rating_rt: body.rating_rt ?? null,
          rating_metacritic: body.rating_metacritic ?? null,
          episode_count: body.episode_count ?? 0,
          season_count: body.season_count ?? 0,
          runtime_per_episode: body.runtime_per_episode ?? null,
          keywords: body.keywords ? JSON.stringify(body.keywords) : null,
        })
        .run();

      const showId = Number(info.lastInsertRowid);

      (body.language_ids ?? []).forEach((lid) =>
        db
          .insert(tvLanguagesTable)
          .values({ show_id: showId, language_id: lid })
          .onConflictDoNothing()
          .run()
      );
      (body.genre_ids ?? []).forEach((gid) =>
        db
          .insert(tvGenresTable)
          .values({ show_id: showId, genre_id: gid })
          .onConflictDoNothing()
          .run()
      );
      (body.cast ?? []).forEach((castMember, i) => {
        const personId = upsertPerson(castMember);
        db
          .insert(tvCastTable)
          .values({
            show_id: showId,
            person_id: personId,
            role: castMember.role,
            character: castMember.character ?? null,
            display_order: castMember.display_order ?? i,
          })
          .onConflictDoNothing()
          .run();
      });
      (body.companies ?? []).forEach((comp) => {
        const companyId = upsertCompany(comp);
        db
          .insert(tvCompaniesTable)
          .values({
            show_id: showId,
            company_id: companyId,
            role: comp.role,
          })
          .onConflictDoNothing()
          .run();
      });

      const showRow = db
        .select({ uuid: tvShowsTable.uuid })
        .from(tvShowsTable)
        .where(eq(tvShowsTable.id, showId))
        .get();
      return getTVShowWithDetails(showRow?.uuid ?? showId)!;
    })();

    return c.json({ success: true, message: "TV Show created successfully", data: result }, 201);
  } catch (err: unknown) {
    return c.json({ success: false, error: "Failed to create TV show", message: getErrorMessage(err) }, 500);
  }
});

// ── PUT /tv/:uuid ──────────────────────────────────────────────────────────────
router.put("/:uuid", requireAuth, async (c) => {
  try {
    const uuid = c.req.param("uuid");
    if (!uuid)
      return c.json({ success: false, error: "Invalid TV Show UUID" }, 400);

    const existing = db
      .select()
      .from(tvShowsTable)
      .where(eq(tvShowsTable.uuid, uuid))
      .get() as (TVShow & { keywords?: string }) | undefined;

    if (!existing)
      return c.json({ success: false, error: "TV Show not found" }, 404);

    const id = existing.id;
    const body = await c.req.json<UpdateTVShowRequest>().catch(() => ({} as UpdateTVShowRequest));

    const result = db.transaction(() => {
      db.update(tvShowsTable)
        .set({
          title: body.title?.trim() ?? existing.title,
          tagline: clean(body.tagline ?? existing.tagline),
          description: body.description?.trim() ?? existing.description ?? "",
          status: body.status ?? existing.status ?? "returning_series",
          first_air_date: body.first_air_date ?? existing.first_air_date ?? null,
          last_air_date: body.last_air_date ?? existing.last_air_date ?? null,
          network: clean(body.network ?? existing.network),
          origin_country: clean(body.origin_country ?? existing.origin_country),
          original_language: clean(body.original_language ?? existing.original_language),
          age_rating: clean(body.age_rating ?? existing.age_rating),
          imdb_id: clean(body.imdb_id ?? existing.imdb_id),
          tmdb_id: body.tmdb_id ?? existing.tmdb_id ?? null,
          letterboxd_id: clean(body.letterboxd_id ?? existing.letterboxd_id),
          wikidata_id: clean(body.wikidata_id ?? existing.wikidata_id),
          poster_url: clean(body.poster_url ?? existing.poster_url),
          backdrop_url: clean(body.backdrop_url ?? existing.backdrop_url),
          budget: body.budget ?? existing.budget ?? null,
          box_office: body.box_office ?? existing.box_office ?? null,
          rating_imdb: body.rating_imdb ?? existing.rating_imdb ?? null,
          rating_rt: body.rating_rt ?? existing.rating_rt ?? null,
          rating_metacritic: body.rating_metacritic ?? existing.rating_metacritic ?? null,
          episode_count: body.episode_count ?? existing.episode_count ?? 0,
          season_count: body.season_count ?? existing.season_count ?? 0,
          runtime_per_episode: body.runtime_per_episode ?? existing.runtime_per_episode ?? null,
          keywords: body.keywords ? JSON.stringify(body.keywords) : existing.keywords ?? null,
          updated_at: sql`datetime('now')`,
        })
        .where(eq(tvShowsTable.id, id))
        .run();

      if (body.language_ids !== undefined) {
        db.delete(tvLanguagesTable).where(eq(tvLanguagesTable.show_id, id)).run();
        body.language_ids.forEach((lid) =>
          db
            .insert(tvLanguagesTable)
            .values({ show_id: id, language_id: lid })
            .onConflictDoNothing()
            .run()
        );
      }
      if (body.genre_ids !== undefined) {
        db.delete(tvGenresTable).where(eq(tvGenresTable.show_id, id)).run();
        body.genre_ids.forEach((gid) =>
          db
            .insert(tvGenresTable)
            .values({ show_id: id, genre_id: gid })
            .onConflictDoNothing()
            .run()
        );
      }
      if (body.cast !== undefined) {
        db.delete(tvCastTable).where(eq(tvCastTable.show_id, id)).run();
        body.cast.forEach((castMember, i) => {
          const personId = upsertPerson(castMember);
          db
            .insert(tvCastTable)
            .values({
              show_id: id,
              person_id: personId,
              role: castMember.role,
              character: castMember.character ?? null,
              display_order: castMember.display_order ?? i,
            })
            .onConflictDoNothing()
            .run();
        });
      }
      if (body.companies !== undefined) {
        db.delete(tvCompaniesTable).where(eq(tvCompaniesTable.show_id, id)).run();
        body.companies.forEach((comp) => {
          const companyId = upsertCompany(comp);
          db
            .insert(tvCompaniesTable)
            .values({
              show_id: id,
              company_id: companyId,
              role: comp.role,
            })
            .onConflictDoNothing()
            .run();
        });
      }

      return getTVShowWithDetails(uuid)!;
    })();

    return c.json({ success: true, message: "TV Show updated successfully", data: result });
  } catch (err: unknown) {
    return c.json({ success: false, error: "Failed to update TV show", message: getErrorMessage(err) }, 500);
  }
});

// ── DELETE /tv/:uuid ───────────────────────────────────────────────────────────
router.delete("/:uuid", requireModerator, (c) => {
  try {
    const uuid = c.req.param("uuid");
    const existing = db
      .select({ id: tvShowsTable.id, title: tvShowsTable.title })
      .from(tvShowsTable)
      .where(eq(tvShowsTable.uuid, uuid))
      .get() as Pick<TVShow, "id" | "title"> | undefined;

    if (!existing)
      return c.json({ success: false, error: "TV Show not found" }, 404);

    db.transaction(() => {
      // Junction tables have ON DELETE CASCADE so deleting the show cleans them up
      db.delete(tvShowsTable).where(eq(tvShowsTable.id, existing.id)).run();
    })();

    return c.json({ success: true, message: "TV Show deleted successfully", data: { id: existing.id } });
  } catch (err: unknown) {
    return c.json({ success: false, error: "Failed to delete TV show", message: getErrorMessage(err) }, 500);
  }
});

export default router;
