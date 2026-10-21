// src/routes/movies.ts
import { Hono } from "hono";
import db, {
  movies as moviesTable,
  movieLanguages as movieLanguagesTable,
  movieGenres as movieGenresTable,
  movieCast as movieCastTable,
  movieCompanies as movieCompaniesTable,
  people as peopleTable,
  companies as companiesTable,
  languages as languagesTable,
  genres as genresTable,
  watchlist as watchlistTable,
} from "../db";
import {
  eq,
  ne,
  inArray,
  desc,
  asc,
  sql,
  like,
  or,
  and,
  isNotNull,
  type SQL,
} from "drizzle-orm";
import { optionalAuth, requireAuth, requireModerator } from "../middleware/authMiddleware";
import { getMovieBlockCondition } from "../utils/preferences";
import { resolveImage, tmdbYoutube } from "../utils/imageUtils";
import { getMovieWatchlistSet } from "../utils/watchlistCache";
import { clean } from "../utils/stringUtils";
import { getErrorMessage } from "../utils/errors";
import type {
  Movie,
  MovieCard,
  MovieWithDetails,
  Language,
  Genre,
  CastMember,
  MovieCompany,
  CreateMovieRequest,
  UpdateMovieRequest,
  CastMemberRequest,
  CompanyRequest,
  PaginationMeta,
} from "shared-types";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

const movieCardSelection = {
  id: moviesTable.id,
  uuid: moviesTable.uuid,
  title: moviesTable.title,
  tagline: moviesTable.tagline,
  description: moviesTable.description,
  status: moviesTable.status,
  release_year: moviesTable.release_year,
  runtime: moviesTable.runtime,
  age_rating: moviesTable.age_rating,
  tmdb_id: moviesTable.tmdb_id,
  poster_url: moviesTable.poster_url,
  backdrop_url: moviesTable.backdrop_url,
  local_poster_url: moviesTable.local_poster_url,
  local_backdrop_url: moviesTable.local_backdrop_url,
  tmdb_poster_path: moviesTable.tmdb_poster_path,
  tmdb_backdrop_path: moviesTable.tmdb_backdrop_path,
  rating_imdb: moviesTable.rating_imdb,
};

function parsePage(query: Record<string, string | undefined>): {
  page: number;
  limit: number;
  offset: number;
} {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(query.limit as string) || 20),
  );
  return { page, limit, offset: (page - 1) * limit };
}

function makePagination(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/** Build a Set of movie_ids currently in the watchlist — used to set in_watchlist */
function getWatchlistSet(userId?: string): Set<number> {
  return getMovieWatchlistSet(userId);
}

/**
 * Attach languages + genres to a list of raw movie rows and return MovieCard[].
 * 2 queries regardless of list size. Cast and companies are NOT fetched.
 */
function toMovieCards(movies: Movie[], watchlistSet: Set<number>): MovieCard[] {
  if (movies.length === 0) return [];
  const ids = movies.map((m) => m.id);

  const allLangs = db
    .select({
      movie_id: movieLanguagesTable.movie_id,
      id: languagesTable.id,
      name: languagesTable.name,
      code: languagesTable.code,
    })
    .from(languagesTable)
    .innerJoin(movieLanguagesTable, eq(languagesTable.id, movieLanguagesTable.language_id))
    .where(inArray(movieLanguagesTable.movie_id, ids))
    .all();

  const allGenres = db
    .select({
      movie_id: movieGenresTable.movie_id,
      id: genresTable.id,
      name: genresTable.name,
      slug: genresTable.slug,
    })
    .from(genresTable)
    .innerJoin(movieGenresTable, eq(genresTable.id, movieGenresTable.genre_id))
    .where(inArray(movieGenresTable.movie_id, ids))
    .all();

  const langMap = new Map<
    number,
    { id: number; name: string; code: string }[]
  >();
  const genreMap = new Map<
    number,
    { id: number; name: string; slug: string }[]
  >();

  allLangs.forEach(({ movie_id, ...l }) => {
    if (!langMap.has(movie_id)) langMap.set(movie_id, []);
    langMap.get(movie_id)!.push(l);
  });
  allGenres.forEach(({ movie_id, ...g }) => {
    if (!genreMap.has(movie_id)) genreMap.set(movie_id, []);
    genreMap.get(movie_id)!.push(g);
  });

  return movies.map((m) => ({
    id: m.id,
    uuid: m.uuid,
    type: "movie",
    title: m.title,
    poster_url: resolveImage(m.tmdb_poster_path, m.local_poster_url) || m.poster_url,
    backdrop_url: resolveImage(m.tmdb_backdrop_path, m.local_backdrop_url, "w780") || m.backdrop_url,
    release_year: m.release_year,
    runtime: m.runtime,
    rating_imdb: m.rating_imdb,
    age_rating: m.age_rating,
    status: m.status ?? "released",
    in_watchlist: watchlistSet.has(m.id),
    languages: langMap.get(m.id) ?? [],
    genres: genreMap.get(m.id) ?? [],
    description: m.description,
    tagline: m.tagline,
  }));
}

/** Fetch full MovieWithDetails for a single movie — used by GET /:uuid, POST, PUT */
function getMovieWithDetails(identifier: string | number, userId?: string): MovieWithDetails | undefined {
  const isUuid = typeof identifier === "string";
  const movie = db
    .select()
    .from(moviesTable)
    .where(isUuid ? eq(moviesTable.uuid, identifier as string) : eq(moviesTable.id, identifier as number))
    .get() as Movie | undefined;

  if (!movie) return undefined;
  const id = movie.id;

  let inWatchlist = false;
  if (userId) {
    const wl = db
      .select({ id: watchlistTable.id })
      .from(watchlistTable)
      .where(and(eq(watchlistTable.movie_id, id), eq(watchlistTable.user_id, userId)))
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
    .innerJoin(movieLanguagesTable, eq(languagesTable.id, movieLanguagesTable.language_id))
    .where(eq(movieLanguagesTable.movie_id, id))
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
    .innerJoin(movieGenresTable, eq(genresTable.id, movieGenresTable.genre_id))
    .where(eq(movieGenresTable.movie_id, id))
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
      role: movieCastTable.role,
      character: movieCastTable.character,
      display_order: movieCastTable.display_order,
    })
    .from(peopleTable)
    .innerJoin(movieCastTable, eq(peopleTable.id, movieCastTable.person_id))
    .where(eq(movieCastTable.movie_id, id))
    .orderBy(asc(movieCastTable.display_order), asc(movieCastTable.role))
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
      role: movieCompaniesTable.role,
    })
    .from(companiesTable)
    .innerJoin(movieCompaniesTable, eq(companiesTable.id, movieCompaniesTable.company_id))
    .where(eq(movieCompaniesTable.movie_id, id))
    .orderBy(asc(companiesTable.name))
    .all() as MovieCompany[];

  return {
    ...movie,
    spoken_languages: movie.spoken_languages ? JSON.parse(movie.spoken_languages as unknown as string) : undefined,
    production_countries: movie.production_countries ? JSON.parse(movie.production_countries as unknown as string) : undefined,
    keywords: movie.keywords ? JSON.parse(movie.keywords as unknown as string) : undefined,
    poster_url: resolveImage(movie.tmdb_poster_path, movie.local_poster_url) || movie.poster_url,
    backdrop_url: resolveImage(movie.tmdb_backdrop_path, movie.local_backdrop_url, "original") || movie.backdrop_url,
    trailer_url: tmdbYoutube(movie.tmdb_trailer_key) || movie.trailer_url,
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
  };
}

/** Upsert a person, return their id */
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

/** Upsert a company, return its id */
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

// ── GET /movies/recent ────────────────────────────────────────────────────────
router.get("/recent", optionalAuth, (c) => {
  try {
    const user = c.get("user");
    const blockCond = getMovieBlockCondition(user?.id);

    let query = db.select(movieCardSelection).from(moviesTable).$dynamic();
    if (blockCond) {
      query = query.where(blockCond);
    }

    const movies = query
      .orderBy(desc(moviesTable.release_year))
      .limit(20)
      .all() as unknown as Movie[];

    const cards = toMovieCards(movies, getWatchlistSet(user?.id));
    c.header("Cache-Control", user ? "private, max-age=60" : "public, max-age=300");
    return c.json({ success: true, data: cards });
  } catch (err: unknown) {
    return c.json({
      success: false,
      error: "Failed to fetch recent movies",
      message: getErrorMessage(err),
    }, 500);
  }
});

// ── GET /movies/top-rated ─────────────────────────────────────────────────────
router.get("/top-rated", optionalAuth, (c) => {
  try {
    const user = c.get("user");
    const blockCond = getMovieBlockCondition(user?.id);

    const conditions: SQL[] = [isNotNull(moviesTable.rating_imdb)];
    if (blockCond) {
      conditions.push(blockCond);
    }

    const movies = db
      .select(movieCardSelection)
      .from(moviesTable)
      .where(and(...conditions))
      .orderBy(desc(moviesTable.rating_imdb))
      .limit(20)
      .all() as unknown as Movie[];

    const cards = toMovieCards(movies, getWatchlistSet(user?.id));
    c.header("Cache-Control", user ? "private, max-age=60" : "public, max-age=300");
    return c.json({ success: true, data: cards });
  } catch (err: unknown) {
    return c.json({
      success: false,
      error: "Failed to fetch top-rated movies",
      message: getErrorMessage(err),
    }, 500);
  }
});

// ── GET /movies/hot ───────────────────────────────────────────────────────────
// "Hot" = movies most recently added/updated in the watchlist
router.get("/hot", optionalAuth, (c) => {
  try {
    const user = c.get("user");
    const blockCond = getMovieBlockCondition(user?.id);

    let query = db
      .select(movieCardSelection)
      .from(moviesTable)
      .innerJoin(watchlistTable, eq(moviesTable.id, watchlistTable.movie_id))
      .$dynamic();

    if (blockCond) {
      query = query.where(blockCond);
    }

    const movies = query
      .orderBy(desc(watchlistTable.updated_at))
      .limit(20)
      .all() as unknown as Movie[];

    const cards = toMovieCards(movies, getWatchlistSet(user?.id));
    c.header("Cache-Control", user ? "private, max-age=60" : "public, max-age=300");
    return c.json({ success: true, data: cards });
  } catch (err: unknown) {
    return c.json({
      success: false,
      error: "Failed to fetch hot movies",
      message: getErrorMessage(err),
    }, 500);
  }
});

// ── GET /movies/search ────────────────────────────────────────────────────────
router.get("/search", optionalAuth, (c) => {
  try {
    const user = c.get("user");
    const blockCond = getMovieBlockCondition(user?.id);
    const q = c.req.query("q")?.trim() ?? "";
    if (!q)
      return c.json({ success: false, error: "Query param 'q' is required" }, 400);

    const { page, limit, offset } = parsePage(c.req.query());
    const pattern = `%${q}%`;

    const searchCond = or(
      like(moviesTable.title, pattern),
      like(moviesTable.description, pattern),
      like(moviesTable.director, pattern),
      like(moviesTable.tagline, pattern)
    );
    const whereCond = blockCond ? and(searchCond, blockCond) : searchCond;

    const totalRow = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(moviesTable)
      .where(whereCond)
      .get();
    const total = Number(totalRow?.count ?? 0);

    const movies = db
      .select(movieCardSelection)
      .from(moviesTable)
      .where(whereCond)
      .orderBy(
        sql`CASE WHEN ${moviesTable.title} LIKE ${pattern} THEN 0 ELSE 1 END`,
        desc(moviesTable.created_at)
      )
      .limit(limit)
      .offset(offset)
      .all() as unknown as Movie[];

    const cards = toMovieCards(movies, getWatchlistSet(user?.id));
    return c.json({
      success: true,
      data: cards,
      pagination: makePagination(page, limit, total),
    });
  } catch (err: unknown) {
    return c.json({ success: false, error: "Search failed", message: getErrorMessage(err) }, 500);
  }
});

// ── GET /movies ───────────────────────────────────────────────────────────────
router.get("/", optionalAuth, (c) => {
  try {
    const user = c.get("user");
    const blockCond = getMovieBlockCondition(user?.id);
    const query = c.req.query();
    const sort = query.sort ?? "recent";
    const language = query.language;
    const genre = query.genre;
    const year = query.year;
    const status = query.status;
    const { page, limit, offset } = parsePage(query);

    const conditions: SQL[] = [];
    if (blockCond) conditions.push(blockCond);
    if (year) conditions.push(eq(moviesTable.release_year, parseInt(year)));
    if (status) conditions.push(eq(moviesTable.status, status));

    if (language) {
      const langSub = db
        .select({ movie_id: movieLanguagesTable.movie_id })
        .from(movieLanguagesTable)
        .innerJoin(languagesTable, eq(languagesTable.id, movieLanguagesTable.language_id))
        .where(eq(languagesTable.code, language));
      conditions.push(inArray(moviesTable.id, langSub));
    }
    if (genre) {
      const genreSub = db
        .select({ movie_id: movieGenresTable.movie_id })
        .from(movieGenresTable)
        .innerJoin(genresTable, eq(genresTable.id, movieGenresTable.genre_id))
        .where(eq(genresTable.slug, genre));
      conditions.push(inArray(moviesTable.id, genreSub));
    }

    const whereCond = conditions.length > 0 ? and(...conditions) : undefined;

    const totalRow = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(moviesTable)
      .where(whereCond)
      .get();
    const total = Number(totalRow?.count ?? 0);

    let orderClause;
    switch (sort) {
      case "title":
        orderClause = [asc(moviesTable.title)];
        break;
      case "year":
        orderClause = [desc(moviesTable.release_year)];
        break;
      case "rating":
        orderClause = [desc(moviesTable.rating_imdb)];
        break;
      case "recent":
      default:
        orderClause = [desc(moviesTable.created_at)];
        break;
    }

    let moviesQuery = db.select(movieCardSelection).from(moviesTable).$dynamic();
    if (whereCond) moviesQuery = moviesQuery.where(whereCond);
    const movies = moviesQuery
      .orderBy(...orderClause)
      .limit(limit)
      .offset(offset)
      .all() as unknown as Movie[];

    const cards = toMovieCards(movies, getWatchlistSet(user?.id));
    return c.json({
      success: true,
      data: cards,
      pagination: makePagination(page, limit, total),
    });
  } catch (err: unknown) {
    return c.json({
      success: false,
      error: "Failed to fetch movies",
      message: getErrorMessage(err),
    }, 500);
  }
});

// ── GET /movies/:uuid/similar ───────────────────────────────────────────────────
// Declared BEFORE /:uuid
router.get("/:uuid/similar", optionalAuth, (c) => {
  try {
    const uuid = c.req.param("uuid");
    const user = c.get("user");
    const blockCond = getMovieBlockCondition(user?.id);

    const movie = db
      .select({ id: moviesTable.id })
      .from(moviesTable)
      .where(eq(moviesTable.uuid, uuid))
      .get();
    if (!movie) return c.json({ success: false, error: "Movie not found" }, 404);

    const genreSub = db
      .select({ genre_id: movieGenresTable.genre_id })
      .from(movieGenresTable)
      .where(eq(movieGenresTable.movie_id, movie.id));

    const conditions: SQL[] = [
      inArray(movieGenresTable.genre_id, genreSub),
      ne(moviesTable.id, movie.id),
    ];
    if (blockCond) conditions.push(blockCond);

    const similar = db
      .select({
        ...movieCardSelection,
        shared_genres: sql<number>`count(${movieGenresTable.genre_id})`.as("shared_genres"),
      })
      .from(moviesTable)
      .innerJoin(movieGenresTable, eq(moviesTable.id, movieGenresTable.movie_id))
      .where(and(...conditions))
      .groupBy(moviesTable.id)
      .orderBy(sql`shared_genres desc`, desc(moviesTable.release_year))
      .limit(15)
      .all() as unknown as Movie[];

    const cards = toMovieCards(similar, getWatchlistSet(user?.id));
    return c.json({ success: true, data: cards });
  } catch (err: unknown) {
    return c.json({ success: false, error: "Failed to fetch similar movies", message: getErrorMessage(err) }, 500);
  }
});

// ── GET /movies/:uuid ───────────────────────────────────────────────────────────
router.get("/:uuid", optionalAuth, (c) => {
  try {
    const user = c.get("user");
    const uuid = c.req.param("uuid");
    if (!uuid)
      return c.json({ success: false, error: "Invalid movie UUID" }, 400);

    const movie = getMovieWithDetails(uuid, user?.id);
    if (!movie)
      return c.json({ success: false, error: "Movie not found" }, 404);

    return c.json({ success: true, data: movie });
  } catch (err: unknown) {
    return c.json({
      success: false,
      error: "Failed to fetch movie",
      message: getErrorMessage(err),
    }, 500);
  }
});

// ── POST /movies ──────────────────────────────────────────────────────────────
router.post("/", requireAuth, async (c) => {
  try {
    const body = await c.req.json<CreateMovieRequest>().catch(() => ({} as CreateMovieRequest));
    if (!body.title?.trim())
      return c.json({ success: false, error: "Title is required" }, 400);

    const result = db.transaction(() => {
      const info = db
        .insert(moviesTable)
        .values({
          uuid: sql`lower(hex(randomblob(16)))`,
          title: body.title.trim(),
          tagline: clean(body.tagline),
          description: body.description?.trim() ?? "",
          status: body.status ?? "released",
          release_year: body.release_year ?? null,
          runtime: body.runtime ?? null,
          origin_country: clean(body.origin_country),
          original_language: clean(body.original_language),
          age_rating: clean(body.age_rating),
          imdb_id: clean(body.imdb_id),
          tmdb_id: body.tmdb_id ?? null,
          letterboxd_id: clean(body.letterboxd_id),
          wikidata_id: clean(body.wikidata_id),
          rottentomatoes_id: clean(body.rottentomatoes_id),
          poster_url: clean(body.poster_url),
          backdrop_url: clean(body.backdrop_url),
          trailer_url: clean(body.trailer_url),
          budget: body.budget ?? null,
          box_office: body.box_office ?? null,
          rating_imdb: body.rating_imdb ?? null,
          rating_rt: body.rating_rt ?? null,
          rating_metacritic: body.rating_metacritic ?? null,
          spoken_languages: body.spoken_languages ? JSON.stringify(body.spoken_languages) : null,
          production_countries: body.production_countries ? JSON.stringify(body.production_countries) : null,
          keywords: body.keywords ? JSON.stringify(body.keywords) : null,
          content_advisory: clean(body.content_advisory),
        })
        .run();
      const movieId = Number(info.lastInsertRowid);

      (body.language_ids ?? []).forEach((lid) =>
        db
          .insert(movieLanguagesTable)
          .values({ movie_id: movieId, language_id: lid })
          .onConflictDoNothing()
          .run()
      );
      (body.genre_ids ?? []).forEach((gid) =>
        db
          .insert(movieGenresTable)
          .values({ movie_id: movieId, genre_id: gid })
          .onConflictDoNothing()
          .run()
      );
      (body.cast ?? []).forEach((castMember, i) => {
        const personId = upsertPerson(castMember);
        db
          .insert(movieCastTable)
          .values({
            movie_id: movieId,
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
          .insert(movieCompaniesTable)
          .values({
            movie_id: movieId,
            company_id: companyId,
            role: comp.role,
          })
          .onConflictDoNothing()
          .run();
      });

      const movieRow = db
        .select({ uuid: moviesTable.uuid })
        .from(moviesTable)
        .where(eq(moviesTable.id, movieId))
        .get();
      return getMovieWithDetails(movieRow?.uuid ?? movieId)!;
    })();

    return c.json({
      success: true,
      message: "Movie created successfully",
      data: result,
    }, 201);
  } catch (err: unknown) {
    return c.json({
      success: false,
      error: "Failed to create movie",
      message: getErrorMessage(err),
    }, 500);
  }
});

// ── PUT /movies/:uuid ───────────────────────────────────────────────────────────
router.put("/:uuid", requireAuth, async (c) => {
  try {
    const uuid = c.req.param("uuid");
    if (!uuid)
      return c.json({ success: false, error: "Invalid movie UUID" }, 400);

    const existing = db
      .select()
      .from(moviesTable)
      .where(eq(moviesTable.uuid, uuid))
      .get() as
      | (Movie & { spoken_languages?: string; production_countries?: string; keywords?: string })
      | undefined;
    if (!existing)
      return c.json({ success: false, error: "Movie not found" }, 404);

    const id = existing.id;
    const body = await c.req.json<UpdateMovieRequest>().catch(() => ({} as UpdateMovieRequest));

    const result = db.transaction(() => {
      db.update(moviesTable)
        .set({
          title: body.title?.trim() ?? existing.title,
          tagline: clean(body.tagline ?? existing.tagline),
          description: body.description?.trim() ?? existing.description ?? "",
          status: body.status ?? existing.status ?? "released",
          release_year: body.release_year ?? existing.release_year ?? null,
          runtime: body.runtime ?? existing.runtime ?? null,
          origin_country: clean(body.origin_country ?? existing.origin_country),
          original_language: clean(body.original_language ?? existing.original_language),
          age_rating: clean(body.age_rating ?? existing.age_rating),
          imdb_id: clean(body.imdb_id ?? existing.imdb_id),
          tmdb_id: body.tmdb_id ?? existing.tmdb_id ?? null,
          letterboxd_id: clean(body.letterboxd_id ?? existing.letterboxd_id),
          wikidata_id: clean(body.wikidata_id ?? existing.wikidata_id),
          rottentomatoes_id: clean(body.rottentomatoes_id ?? existing.rottentomatoes_id),
          poster_url: clean(body.poster_url ?? existing.poster_url),
          backdrop_url: clean(body.backdrop_url ?? existing.backdrop_url),
          trailer_url: clean(body.trailer_url ?? existing.trailer_url),
          budget: body.budget ?? existing.budget ?? null,
          box_office: body.box_office ?? existing.box_office ?? null,
          rating_imdb: body.rating_imdb ?? existing.rating_imdb ?? null,
          rating_rt: body.rating_rt ?? existing.rating_rt ?? null,
          rating_metacritic: body.rating_metacritic ?? existing.rating_metacritic ?? null,
          spoken_languages: body.spoken_languages ? JSON.stringify(body.spoken_languages) : existing.spoken_languages ?? null,
          production_countries: body.production_countries ? JSON.stringify(body.production_countries) : existing.production_countries ?? null,
          keywords: body.keywords ? JSON.stringify(body.keywords) : existing.keywords ?? null,
          content_advisory: clean(body.content_advisory ?? existing.content_advisory),
          updated_at: sql`datetime('now')`,
        })
        .where(eq(moviesTable.id, id))
        .run();

      if (body.language_ids !== undefined) {
        db.delete(movieLanguagesTable).where(eq(movieLanguagesTable.movie_id, id)).run();
        body.language_ids.forEach((lid) =>
          db
            .insert(movieLanguagesTable)
            .values({ movie_id: id, language_id: lid })
            .onConflictDoNothing()
            .run()
        );
      }
      if (body.genre_ids !== undefined) {
        db.delete(movieGenresTable).where(eq(movieGenresTable.movie_id, id)).run();
        body.genre_ids.forEach((gid) =>
          db
            .insert(movieGenresTable)
            .values({ movie_id: id, genre_id: gid })
            .onConflictDoNothing()
            .run()
        );
      }
      if (body.cast !== undefined) {
        db.delete(movieCastTable).where(eq(movieCastTable.movie_id, id)).run();
        body.cast.forEach((castMember, i) => {
          const personId = upsertPerson(castMember);
          db
            .insert(movieCastTable)
            .values({
              movie_id: id,
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
        db.delete(movieCompaniesTable).where(eq(movieCompaniesTable.movie_id, id)).run();
        body.companies.forEach((comp) => {
          const companyId = upsertCompany(comp);
          db
            .insert(movieCompaniesTable)
            .values({
              movie_id: id,
              company_id: companyId,
              role: comp.role,
            })
            .onConflictDoNothing()
            .run();
        });
      }

      return getMovieWithDetails(uuid)!;
    })();

    return c.json({
      success: true,
      message: "Movie updated successfully",
      data: result,
    });
  } catch (err: unknown) {
    return c.json({
      success: false,
      error: "Failed to update movie",
      message: getErrorMessage(err),
    }, 500);
  }
});

// ── DELETE /movies/:uuid ────────────────────────────────────────────────────────
router.delete("/:uuid", requireModerator, (c) => {
  try {
    const uuid = c.req.param("uuid");
    if (!uuid)
      return c.json({ success: false, error: "Invalid movie UUID" }, 400);

    const movie = db
      .select({ id: moviesTable.id, title: moviesTable.title })
      .from(moviesTable)
      .where(eq(moviesTable.uuid, uuid))
      .get() as Pick<Movie, "id" | "title"> | undefined;

    if (!movie)
      return c.json({ success: false, error: "Movie not found" }, 404);

    db.delete(moviesTable).where(eq(moviesTable.id, movie.id)).run();
    return c.json({
      success: true,
      message: "Movie deleted successfully",
      data: { deletedId: movie.id, title: movie.title },
    });
  } catch (err: unknown) {
    return c.json({
      success: false,
      error: "Failed to delete movie",
      message: getErrorMessage(err),
    }, 500);
  }
});

export default router;
