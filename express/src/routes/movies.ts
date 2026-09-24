// src/routes/movies.ts
import express, { Request, Response, Router } from "express";
import db from "../db";
import { optionalAuth } from "../middleware/authMiddleware";
import { getBlockConditions } from "../utils/preferences";
import { resolveImage, tmdbYoutube } from "../utils/imageUtils";
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
  UuidParam,
  MovieListQuery,
  PaginationQuery,
  PaginationMeta,
} from "shared-types";

const router: Router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

function clean(str?: string | null): string | null {
  if (str === undefined || str === null) return null;
  const t = str.trim();
  return t === "" ? null : t;
}

function parsePage(query: PaginationQuery): {
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
function getWatchlistSet(): Set<number> {
  const rows = db.prepare(`SELECT movie_id FROM watchlist`).all() as {
    movie_id: number;
  }[];
  return new Set(rows.map((r) => r.movie_id));
}

/**
 * Attach languages + genres to a list of raw movie rows and return MovieCard[].
 * 2 queries regardless of list size. Cast and companies are NOT fetched.
 */
function toMovieCards(movies: Movie[], watchlistSet: Set<number>): MovieCard[] {
  if (movies.length === 0) return [];
  const ids = movies.map((m) => m.id);
  const ph = ids.map(() => "?").join(",");

  const allLangs = db
    .prepare(
      `SELECT ml.movie_id, l.id, l.name, l.code
       FROM languages l
       JOIN movie_languages ml ON l.id = ml.language_id
       WHERE ml.movie_id IN (${ph})`,
    )
    .all(...ids) as Array<{
    movie_id: number;
    id: number;
    name: string;
    code: string;
  }>;

  const allGenres = db
    .prepare(
      `SELECT mg.movie_id, g.id, g.name, g.slug
       FROM genres g
       JOIN movie_genres mg ON g.id = mg.genre_id
       WHERE mg.movie_id IN (${ph})`,
    )
    .all(...ids) as Array<{
    movie_id: number;
    id: number;
    name: string;
    slug: string;
  }>;

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
    backdrop_url: resolveImage(m.tmdb_backdrop_path, m.local_backdrop_url, 'w780') || m.backdrop_url,
    release_year: m.release_year,
    runtime: m.runtime,
    rating_imdb: m.rating_imdb,
    age_rating: m.age_rating,
    status: m.status ?? "released",
    in_watchlist: watchlistSet.has(m.id),
    languages: langMap.get(m.id) ?? [],
    genres: genreMap.get(m.id) ?? [],
  }));
}

/** Fetch full MovieWithDetails for a single movie — used by GET /:uuid, POST, PUT */
function getMovieWithDetails(identifier: string | number): MovieWithDetails | undefined {
  const isUuid = typeof identifier === "string";
  const movie = isUuid
    ? db.prepare(`SELECT * FROM movies WHERE uuid = ?`).get(identifier) as Movie | undefined
    : db.prepare(`SELECT * FROM movies WHERE id = ?`).get(identifier) as Movie | undefined;
  
  if (!movie) return undefined;
  const id = movie.id;

  const inWatchlist = !!db
    .prepare(`SELECT 1 FROM watchlist WHERE movie_id = ?`)
    .get(id);

  const languages = db
    .prepare(
      `SELECT l.id, l.name, l.code, l.native_script
       FROM languages l
       JOIN movie_languages ml ON l.id = ml.language_id
       WHERE ml.movie_id = ?`,
    )
    .all(id) as Language[];

  const genres = db
    .prepare(
      `SELECT g.id, g.name, g.slug, g.description, g.created_at
       FROM genres g
       JOIN movie_genres mg ON g.id = mg.genre_id
       WHERE mg.movie_id = ?`,
    )
    .all(id) as Genre[];

  const cast = db
    .prepare(
      `SELECT p.id, p.name, p.also_known_as, p.profile_url, p.tmdb_id, p.imdb_id,
              p.tmdb_profile_path, p.local_profile_url,
              mc.role, mc.character, mc.display_order
       FROM people p
       JOIN movie_cast mc ON p.id = mc.person_id
       WHERE mc.movie_id = ?
       ORDER BY mc.display_order ASC, mc.role ASC`,
    )
    .all(id) as CastMember[];

  const companies = db
    .prepare(
      `SELECT c.id, c.name, c.type, c.logo_url, c.country, c.tmdb_id, c.tmdb_logo_path, mco.role
       FROM companies c
       JOIN movie_companies mco ON c.id = mco.company_id
       WHERE mco.movie_id = ?
       ORDER BY c.name ASC`,
    )
    .all(id) as MovieCompany[];

  return {
    ...movie,
    spoken_languages: movie.spoken_languages ? JSON.parse(movie.spoken_languages as unknown as string) : undefined,
    production_countries: movie.production_countries ? JSON.parse(movie.production_countries as unknown as string) : undefined,
    keywords: movie.keywords ? JSON.parse(movie.keywords as unknown as string) : undefined,
    poster_url: resolveImage(movie.tmdb_poster_path, movie.local_poster_url) || movie.poster_url,
    backdrop_url: resolveImage(movie.tmdb_backdrop_path, movie.local_backdrop_url, 'original') || movie.backdrop_url,
    trailer_url: tmdbYoutube(movie.tmdb_trailer_key) || movie.trailer_url,
    in_watchlist: inWatchlist,
    languages,
    genres,
    cast: cast.map((c: any) => ({
      ...c,
      profile_url: resolveImage(c.tmdb_profile_path, c.local_profile_url, 'w185') || c.profile_url
    })),
    companies: companies.map((c: any) => ({
      ...c,
      logo_url: resolveImage(c.tmdb_logo_path, null, 'w185') || c.logo_url
    })),
  };
}

/** Upsert a person, return their id */
function upsertPerson(req: CastMemberRequest): number {
  if (req.person_id) return req.person_id;
  const existing = db
    .prepare(`SELECT id FROM people WHERE name = ? COLLATE NOCASE`)
    .get(req.name) as { id: number } | undefined;
  if (existing) return existing.id;
  const info = db
    .prepare(
      `INSERT INTO people (name, profile_url, tmdb_id, imdb_id) VALUES (?, ?, ?, ?)`,
    )
    .run(
      req.name.trim(),
      req.profile_url ?? null,
      req.tmdb_id ?? null,
      req.imdb_id ?? null,
    );
  return info.lastInsertRowid as number;
}

/** Upsert a company, return its id */
function upsertCompany(req: CompanyRequest): number {
  if (req.company_id) return req.company_id;
  const existing = db
    .prepare(`SELECT id FROM companies WHERE name = ? COLLATE NOCASE`)
    .get(req.name) as { id: number } | undefined;
  if (existing) return existing.id;
  const info = db
    .prepare(
      `INSERT INTO companies (name, type, logo_url, country) VALUES (?, ?, ?, ?)`,
    )
    .run(
      req.name.trim(),
      req.type ?? "production",
      req.logo_url ?? null,
      req.country ?? null,
    );
  return info.lastInsertRowid as number;
}

// ── GET /movies/recent ────────────────────────────────────────────────────────
router.get("/recent", optionalAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { clause, params } = getBlockConditions(user?.id);
    const movies = db
      .prepare(`SELECT m.* FROM movies m ${clause} ORDER BY release_year DESC LIMIT 20`)
      .all(...params) as Movie[];
    const cards = toMovieCards(movies, getWatchlistSet());
    res.json({ success: true, data: cards });
  } catch (err: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch recent movies",
        message: err.message,
      });
  }
});

// ── GET /movies/top-rated ─────────────────────────────────────────────────────
router.get("/top-rated", optionalAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { andClause, params } = getBlockConditions(user?.id);
    const movies = db
      .prepare(
        `SELECT m.* FROM movies m WHERE m.rating_imdb IS NOT NULL ${andClause} ORDER BY rating_imdb DESC LIMIT 20`,
      )
      .all(...params) as Movie[];
    const cards = toMovieCards(movies, getWatchlistSet());
    res.json({ success: true, data: cards });
  } catch (err: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch top-rated movies",
        message: err.message,
      });
  }
});

// ── GET /movies/hot ───────────────────────────────────────────────────────────
// "Hot" = movies most recently added/updated in the watchlist
router.get("/hot", optionalAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { clause, params } = getBlockConditions(user?.id);
    const movies = db
      .prepare(
        `SELECT m.* FROM movies m
         JOIN watchlist w ON m.id = w.movie_id
         ${clause}
         ORDER BY w.updated_at DESC
         LIMIT 20`,
      )
      .all(...params) as Movie[];
    const cards = toMovieCards(movies, getWatchlistSet());
    res.json({ success: true, data: cards });
  } catch (err: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch hot movies",
        message: err.message,
      });
  }
});

// ── GET /movies/search ────────────────────────────────────────────────────────
router.get("/search", optionalAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { andClause, params } = getBlockConditions(user?.id);
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!q)
      return res
        .status(400)
        .json({ success: false, error: "Query param 'q' is required" });

    const { page, limit, offset } = parsePage(req.query as PaginationQuery);
    const pattern = `%${q}%`;

    const total = (
      db
        .prepare(
          `SELECT COUNT(*) as count FROM movies m
         WHERE (m.title LIKE ? OR m.description LIKE ? OR m.director LIKE ? OR m.tagline LIKE ?) ${andClause}`,
        )
        .get(pattern, pattern, pattern, pattern, ...params) as { count: number }
    ).count;

    const movies = db
      .prepare(
        `SELECT m.* FROM movies m
         WHERE (m.title LIKE ? OR m.description LIKE ? OR m.director LIKE ? OR m.tagline LIKE ?) ${andClause}
         ORDER BY
           CASE WHEN m.title LIKE ? THEN 0 ELSE 1 END,
           m.created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .all(
        pattern,
        pattern,
        pattern,
        pattern,
        ...params,
        pattern,
        limit,
        offset,
      ) as Movie[];

    const cards = toMovieCards(movies, getWatchlistSet());
    res.json({
      success: true,
      data: cards,
      pagination: makePagination(page, limit, total),
    });
  } catch (err: any) {
    res
      .status(500)
      .json({ success: false, error: "Search failed", message: err.message });
  }
});

// ── GET /movies ───────────────────────────────────────────────────────────────
router.get("/", optionalAuth, (req: Request<{}, {}, {}, MovieListQuery>, res: Response) => {
  try {
    const user = (req as any).user;
    const blockConditions = getBlockConditions(user?.id);
    const { sort = "recent", language, genre, year, status } = req.query;
    const { page, limit, offset } = parsePage(req.query);

    // Build WHERE clauses
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (blockConditions.clause !== "") {
      // It's easier to just push the individual subqueries than parsing the clause
      conditions.push(blockConditions.clause.replace("WHERE ", ""));
      params.push(...blockConditions.params);
    }

    if (year) {
      conditions.push("m.release_year = ?");
      params.push(parseInt(year as string));
    }
    if (status) {
      conditions.push("m.status = ?");
      params.push(status as string);
    }

    // Language and genre filters require joins — do them as subqueries
    if (language) {
      conditions.push(
        `m.id IN (
          SELECT ml.movie_id FROM movie_languages ml
          JOIN languages l ON l.id = ml.language_id
          WHERE l.code = ?
        )`,
      );
      params.push(language as string);
    }
    if (genre) {
      conditions.push(
        `m.id IN (
          SELECT mg.movie_id FROM movie_genres mg
          JOIN genres g ON g.id = mg.genre_id
          WHERE g.slug = ?
        )`,
      );
      params.push(genre as string);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const orderMap: Record<string, string> = {
      recent: "m.created_at DESC",
      title: "m.title ASC",
      year: "m.release_year DESC",
      rating: "m.rating_imdb DESC",
    };
    const orderBy = orderMap[sort as string] ?? "m.created_at DESC";

    const total = (
      db
        .prepare(`SELECT COUNT(*) as count FROM movies m ${where}`)
        .get(...params) as { count: number }
    ).count;

    const movies = db
      .prepare(
        `SELECT m.* FROM movies m ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset) as Movie[];

    const cards = toMovieCards(movies, getWatchlistSet());
    res.json({
      success: true,
      data: cards,
      pagination: makePagination(page, limit, total),
    });
  } catch (err: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch movies",
        message: err.message,
      });
  }
});

// ── GET /movies/:uuid ───────────────────────────────────────────────────────────
router.get("/:uuid", (req: Request<UuidParam>, res: Response) => {
  try {
    const uuid = req.params.uuid;
    if (!uuid)
      return res
        .status(400)
        .json({ success: false, error: "Invalid movie UUID" });

    const movie = getMovieWithDetails(uuid);
    if (!movie)
      return res.status(404).json({ success: false, error: "Movie not found" });

    res.json({ success: true, data: movie });
  } catch (err: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch movie",
        message: err.message,
      });
  }
});

// ── POST /movies ──────────────────────────────────────────────────────────────
router.post("/", (req: Request, res: Response) => {
  try {
    const body = req.body as CreateMovieRequest;
    if (!body.title?.trim())
      return res
        .status(400)
        .json({ success: false, error: "Title is required" });

    const result = db.transaction(() => {
      const info = db
        .prepare(
          `INSERT INTO movies (
            uuid, title, tagline, description, status, release_year, runtime,
            origin_country, original_language, age_rating,
            imdb_id, tmdb_id, letterboxd_id, wikidata_id, rottentomatoes_id,
            poster_url, backdrop_url, trailer_url,
            budget, box_office, rating_imdb, rating_rt, rating_metacritic,
            spoken_languages, production_countries, keywords, content_advisory
          ) VALUES (lower(hex(randomblob(16))),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          body.title.trim(),
          clean(body.tagline),
          body.description?.trim() ?? "",
          body.status ?? "released",
          body.release_year ?? null,
          body.runtime ?? null,
          clean(body.origin_country),
          clean(body.original_language),
          clean(body.age_rating),
          clean(body.imdb_id),
          body.tmdb_id ?? null,
          clean(body.letterboxd_id),
          clean(body.wikidata_id),
          clean(body.rottentomatoes_id),
          clean(body.poster_url),
          clean(body.backdrop_url),
          clean(body.trailer_url),
          body.budget ?? null,
          body.box_office ?? null,
          body.rating_imdb ?? null,
          body.rating_rt ?? null,
          body.rating_metacritic ?? null,
          body.spoken_languages ? JSON.stringify(body.spoken_languages) : null,
          body.production_countries ? JSON.stringify(body.production_countries) : null,
          body.keywords ? JSON.stringify(body.keywords) : null,
          clean(body.content_advisory),
        );
      const movieId = info.lastInsertRowid as number;

      (body.language_ids ?? []).forEach((lid) =>
        db
          .prepare(
            `INSERT OR IGNORE INTO movie_languages (movie_id, language_id) VALUES (?,?)`,
          )
          .run(movieId, lid),
      );
      (body.genre_ids ?? []).forEach((gid) =>
        db
          .prepare(
            `INSERT OR IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?,?)`,
          )
          .run(movieId, gid),
      );
      (body.cast ?? []).forEach((c, i) => {
        const personId = upsertPerson(c);
        db.prepare(
          `INSERT OR IGNORE INTO movie_cast (movie_id, person_id, role, character, display_order) VALUES (?,?,?,?,?)`,
        ).run(
          movieId,
          personId,
          c.role,
          c.character ?? null,
          c.display_order ?? i,
        );
      });
      (body.companies ?? []).forEach((c) => {
        const companyId = upsertCompany(c);
        db.prepare(
          `INSERT OR IGNORE INTO movie_companies (movie_id, company_id, role) VALUES (?,?,?)`,
        ).run(movieId, companyId, c.role);
      });

      const uuid = db.prepare(`SELECT uuid FROM movies WHERE id = ?`).get(movieId) as { uuid: string };
      return getMovieWithDetails(uuid.uuid)!;
    })();

    res
      .status(201)
      .json({
        success: true,
        message: "Movie created successfully",
        data: result,
      });
  } catch (err: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to create movie",
        message: err.message,
      });
  }
});

// ── PUT /movies/:uuid ───────────────────────────────────────────────────────────
router.put("/:uuid", (req: Request<UuidParam>, res: Response) => {
  try {
    const uuid = req.params.uuid;
    if (!uuid)
      return res
        .status(400)
        .json({ success: false, error: "Invalid movie UUID" });

    const existing = db.prepare(`SELECT * FROM movies WHERE uuid = ?`).get(uuid) as
      | Movie
      | undefined;
    if (!existing)
      return res.status(404).json({ success: false, error: "Movie not found" });

    const id = existing.id;
    const body = req.body as UpdateMovieRequest;

    const result = db.transaction(() => {
      db.prepare(
        `UPDATE movies SET
          title = ?, tagline = ?, description = ?, status = ?,
          release_year = ?, runtime = ?, origin_country = ?,
          original_language = ?, age_rating = ?,
          imdb_id = ?, tmdb_id = ?, letterboxd_id = ?, wikidata_id = ?, rottentomatoes_id = ?,
          poster_url = ?, backdrop_url = ?, trailer_url = ?,
          budget = ?, box_office = ?, rating_imdb = ?, rating_rt = ?, rating_metacritic = ?,
          spoken_languages = ?, production_countries = ?, keywords = ?, content_advisory = ?,
          updated_at = datetime('now')
         WHERE id = ?`,
      ).run(
        body.title?.trim() ?? existing.title,
        clean(body.tagline ?? existing.tagline),
        body.description?.trim() ?? existing.description ?? "",
        body.status ?? existing.status ?? "released",
        body.release_year ?? existing.release_year ?? null,
        body.runtime ?? existing.runtime ?? null,
        clean(body.origin_country ?? existing.origin_country),
        clean(body.original_language ?? existing.original_language),
        clean(body.age_rating ?? existing.age_rating),
        clean(body.imdb_id ?? existing.imdb_id),
        body.tmdb_id ?? existing.tmdb_id ?? null,
        clean(body.letterboxd_id ?? existing.letterboxd_id),
        clean(body.wikidata_id ?? (existing as any).wikidata_id),
        clean(body.rottentomatoes_id ?? (existing as any).rottentomatoes_id),
        clean(body.poster_url ?? existing.poster_url),
        clean(body.backdrop_url ?? existing.backdrop_url),
        clean(body.trailer_url ?? existing.trailer_url),
        body.budget ?? existing.budget ?? null,
        body.box_office ?? existing.box_office ?? null,
        body.rating_imdb ?? existing.rating_imdb ?? null,
        body.rating_rt ?? existing.rating_rt ?? null,
        body.rating_metacritic ?? existing.rating_metacritic ?? null,
        body.spoken_languages ? JSON.stringify(body.spoken_languages) : (existing as any).spoken_languages ?? null,
        body.production_countries ? JSON.stringify(body.production_countries) : (existing as any).production_countries ?? null,
        body.keywords ? JSON.stringify(body.keywords) : (existing as any).keywords ?? null,
        clean(body.content_advisory ?? (existing as any).content_advisory),
        id,
      );

      if (body.language_ids !== undefined) {
        db.prepare(`DELETE FROM movie_languages WHERE movie_id = ?`).run(id);
        body.language_ids.forEach((lid) =>
          db
            .prepare(
              `INSERT OR IGNORE INTO movie_languages (movie_id, language_id) VALUES (?,?)`,
            )
            .run(id, lid),
        );
      }
      if (body.genre_ids !== undefined) {
        db.prepare(`DELETE FROM movie_genres WHERE movie_id = ?`).run(id);
        body.genre_ids.forEach((gid) =>
          db
            .prepare(
              `INSERT OR IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?,?)`,
            )
            .run(id, gid),
        );
      }
      if (body.cast !== undefined) {
        db.prepare(`DELETE FROM movie_cast WHERE movie_id = ?`).run(id);
        body.cast.forEach((c, i) => {
          const personId = upsertPerson(c);
          db.prepare(
            `INSERT OR IGNORE INTO movie_cast (movie_id, person_id, role, character, display_order) VALUES (?,?,?,?,?)`,
          ).run(
            id,
            personId,
            c.role,
            c.character ?? null,
            c.display_order ?? i,
          );
        });
      }
      if (body.companies !== undefined) {
        db.prepare(`DELETE FROM movie_companies WHERE movie_id = ?`).run(id);
        body.companies.forEach((c) => {
          const companyId = upsertCompany(c);
          db.prepare(
            `INSERT OR IGNORE INTO movie_companies (movie_id, company_id, role) VALUES (?,?,?)`,
          ).run(id, companyId, c.role);
        });
      }

      return getMovieWithDetails(uuid)!;
    })();

    res.json({
      success: true,
      message: "Movie updated successfully",
      data: result,
    });
  } catch (err: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to update movie",
        message: err.message,
      });
  }
});

// ── DELETE /movies/:uuid ────────────────────────────────────────────────────────
router.delete("/:uuid", (req: Request<UuidParam>, res: Response) => {
  try {
    const uuid = req.params.uuid;
    if (!uuid)
      return res
        .status(400)
        .json({ success: false, error: "Invalid movie UUID" });

    const movie = db
      .prepare(`SELECT id, title FROM movies WHERE uuid = ?`)
      .get(uuid) as Pick<Movie, "id" | "title"> | undefined;
    if (!movie)
      return res.status(404).json({ success: false, error: "Movie not found" });

    db.prepare(`DELETE FROM movies WHERE id = ?`).run(movie.id);
    res.json({
      success: true,
      message: "Movie deleted successfully",
      data: { deletedId: movie.id, title: movie.title },
    });
  } catch (err: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to delete movie",
        message: err.message,
      });
  }
});

export default router;
