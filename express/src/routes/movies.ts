// src/routes/movies.ts
import express, { Request, Response, Router } from "express";
import db from "../db";
import type {
  Movie,
  MovieWithDetails,
  Language,
  Genre,
  CastMember,
  MovieCompany,
  CreateMovieRequest,
  UpdateMovieRequest,
  CastMemberRequest,
  CompanyRequest,
  IdParam,
} from "../types.ts";

const router: Router = express.Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// normalize optional strings: trim and convert empty -> null
function clean(str?: string | null): string | null {
  if (str === undefined || str === null) return null;
  const t = str.trim();
  return t === "" ? null : t;
}

/** Fetch full details for one movie: languages, genres, cast, companies */
function getMovieWithDetails(id: number): MovieWithDetails | undefined {
  const movie = db.prepare(`SELECT * FROM movies WHERE id = ?`).get(id) as
    | Movie
    | undefined;
  if (!movie) return undefined;

  const languages = db
    .prepare(
      `
    SELECT l.id, l.name, l.code, l.native_script
    FROM languages l
    JOIN movie_languages ml ON l.id = ml.language_id
    WHERE ml.movie_id = ?
  `,
    )
    .all(id) as Language[];

  const genres = db
    .prepare(
      `
    SELECT g.id, g.name, g.slug, g.description, g.created_at
    FROM genres g
    JOIN movie_genres mg ON g.id = mg.genre_id
    WHERE mg.movie_id = ?
  `,
    )
    .all(id) as Genre[];

  const cast = db
    .prepare(
      `
    SELECT p.id, p.name, p.also_known_as, p.profile_url, p.tmdb_id, p.imdb_id,
           mc.role, mc.character, mc.display_order
    FROM people p
    JOIN movie_cast mc ON p.id = mc.person_id
    WHERE mc.movie_id = ?
    ORDER BY mc.display_order ASC, mc.role ASC
  `,
    )
    .all(id) as CastMember[];

  const companies = db
    .prepare(
      `
    SELECT c.id, c.name, c.type, c.logo_url, c.country, c.tmdb_id,
           mco.role
    FROM companies c
    JOIN movie_companies mco ON c.id = mco.company_id
    WHERE mco.movie_id = ?
    ORDER BY c.name ASC
  `,
    )
    .all(id) as MovieCompany[];

  return { ...movie, languages, genres, cast, companies };
}

/** Bulk-attach languages + genres to a list of movies (2 queries total) */
function attachDetailsToMovies(movies: Movie[]): MovieWithDetails[] {
  if (movies.length === 0) return [];
  const ids = movies.map((m) => m.id);
  const placeholders = ids.map(() => "?").join(",");

  const allLangs = db
    .prepare(
      `
    SELECT ml.movie_id, l.id, l.name, l.code, l.native_script
    FROM languages l JOIN movie_languages ml ON l.id = ml.language_id
    WHERE ml.movie_id IN (${placeholders})
  `,
    )
    .all(...ids) as Array<Language & { movie_id: number }>;

  const allGenres = db
    .prepare(
      `
    SELECT mg.movie_id, g.id, g.name, g.slug, g.description, g.created_at
    FROM genres g JOIN movie_genres mg ON g.id = mg.genre_id
    WHERE mg.movie_id IN (${placeholders})
  `,
    )
    .all(...ids) as Array<Genre & { movie_id: number }>;

  const allCast = db
    .prepare(
      `
    SELECT mc.movie_id, p.id, p.name, p.profile_url, p.tmdb_id,
           mc.role, mc.character, mc.display_order
    FROM people p JOIN movie_cast mc ON p.id = mc.person_id
    WHERE mc.movie_id IN (${placeholders})
    ORDER BY mc.display_order ASC
  `,
    )
    .all(...ids) as Array<CastMember & { movie_id: number }>;

  const allCompanies = db
    .prepare(
      `
    SELECT mco.movie_id, c.id, c.name, c.type, c.logo_url, c.country, mco.role
    FROM companies c JOIN movie_companies mco ON c.id = mco.company_id
    WHERE mco.movie_id IN (${placeholders})
  `,
    )
    .all(...ids) as Array<MovieCompany & { movie_id: number }>;

  // Build maps
  const langMap = new Map<number, Language[]>();
  const genreMap = new Map<number, Genre[]>();
  const castMap = new Map<number, CastMember[]>();
  const companyMap = new Map<number, MovieCompany[]>();

  allLangs.forEach(({ movie_id, ...l }) => {
    if (!langMap.has(movie_id)) langMap.set(movie_id, []);
    langMap.get(movie_id)!.push(l as Language);
  });
  allGenres.forEach(({ movie_id, ...g }) => {
    if (!genreMap.has(movie_id)) genreMap.set(movie_id, []);
    genreMap.get(movie_id)!.push(g as Genre);
  });
  allCast.forEach(({ movie_id, ...c }) => {
    if (!castMap.has(movie_id)) castMap.set(movie_id, []);
    castMap.get(movie_id)!.push(c as CastMember);
  });
  allCompanies.forEach(({ movie_id, ...c }) => {
    if (!companyMap.has(movie_id)) companyMap.set(movie_id, []);
    companyMap.get(movie_id)!.push(c as MovieCompany);
  });

  return movies.map((m) => ({
    ...m,
    languages: langMap.get(m.id) ?? [],
    genres: genreMap.get(m.id) ?? [],
    cast: castMap.get(m.id) ?? [],
    companies: companyMap.get(m.id) ?? [],
  }));
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
      `
    INSERT INTO people (name, profile_url, tmdb_id, imdb_id)
    VALUES (?, ?, ?, ?)
  `,
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
      `
    INSERT INTO companies (name, type, logo_url, country)
    VALUES (?, ?, ?, ?)
  `,
    )
    .run(
      req.name.trim(),
      req.type ?? "production",
      req.logo_url ?? null,
      req.country ?? null,
    );
  return info.lastInsertRowid as number;
}

// ── GET /movies ───────────────────────────────────────────────────────────────
router.get("/", (req: Request, res: Response) => {
  try {
    const { search, language, genre, year, sort = "recent" } = req.query;

    let movies = db
      .prepare(`SELECT * FROM movies ORDER BY created_at DESC`)
      .all() as Movie[];

    if (search && typeof search === "string") {
      const q = search.toLowerCase();
      movies = movies.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q) ||
          m.director?.toLowerCase().includes(q) ||
          m.tagline?.toLowerCase().includes(q),
      );
    }

    if (year)
      movies = movies.filter(
        (m) => m.release_year === parseInt(year as string),
      );

    let result = attachDetailsToMovies(movies);

    if (language)
      result = result.filter((m) =>
        m.languages.some((l) => l.code === language),
      );
    if (genre)
      result = result.filter((m) => m.genres.some((g) => g.slug === genre));

    if (sort === "title") result.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "year")
      result.sort((a, b) => (b.release_year ?? 0) - (a.release_year ?? 0));
    else if (sort === "rating")
      result.sort((a, b) => (b.rating_imdb ?? 0) - (a.rating_imdb ?? 0));

    res.json({ success: true, count: result.length, movies: result });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch movies",
      message: err.message,
    });
  }
});

// ── GET /movies/:id ───────────────────────────────────────────────────────────
router.get("/:id", (req: Request<IdParam>, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, error: "Invalid movie ID" });

    const movie = getMovieWithDetails(id);
    if (!movie)
      return res.status(404).json({ success: false, error: "Movie not found" });

    res.json({ success: true, movie });
  } catch (err: any) {
    res.status(500).json({
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

    if (!body.title?.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Title is required" });
    }

    const result = db.transaction(() => {
      const info = db
        .prepare(
          `
    INSERT INTO movies (
      title, tagline, description, status, release_year, runtime,
      origin_country, original_language, age_rating, director,
      imdb_id, tmdb_id, poster_url, backdrop_url, trailer_url,
      budget, box_office, rating_imdb, rating_rt, rating_metacritic
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `,
        )
        .run(
          // 20 arguments in the exact order of the columns above
          body.title.trim(), // title (required)
          clean(body.tagline), // tagline
          body.description?.trim() ?? "", // description (default empty string in your schema)
          body.status ?? "released", // status
          body.release_year ?? null, // release_year
          body.runtime ?? null, // runtime
          clean(body.origin_country), // origin_country
          clean(body.original_language), // original_language
          clean(body.age_rating), // age_rating
          clean(body.director), // director
          clean(body.imdb_id), // imdb_id
          body.tmdb_id ?? null, // tmdb_id
          clean(body.poster_url), // poster_url
          clean(body.backdrop_url), // backdrop_url
          clean(body.trailer_url), // trailer_url
          body.budget ?? null, // budget
          body.box_office ?? null, // box_office
          body.rating_imdb ?? null, // rating_imdb
          body.rating_rt ?? null, // rating_rt
          body.rating_metacritic ?? null, // rating_metacritic
        );
      const movieId = info.lastInsertRowid as number;

      // Languages
      (body.language_ids ?? []).forEach((lid) => {
        db.prepare(
          `INSERT OR IGNORE INTO movie_languages (movie_id, language_id) VALUES (?,?)`,
        ).run(movieId, lid);
      });

      // Genres
      (body.genre_ids ?? []).forEach((gid) => {
        db.prepare(
          `INSERT OR IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?,?)`,
        ).run(movieId, gid);
      });

      // Cast
      (body.cast ?? []).forEach((c, i) => {
        const personId = upsertPerson(c);
        db.prepare(
          `
          INSERT OR IGNORE INTO movie_cast (movie_id, person_id, role, character, display_order)
          VALUES (?,?,?,?,?)
        `,
        ).run(
          movieId,
          personId,
          c.role,
          c.character ?? null,
          c.display_order ?? i,
        );
      });

      // Companies
      (body.companies ?? []).forEach((c) => {
        const companyId = upsertCompany(c);
        db.prepare(
          `
          INSERT OR IGNORE INTO movie_companies (movie_id, company_id, role)
          VALUES (?,?,?)
        `,
        ).run(movieId, companyId, c.role);
      });

      return getMovieWithDetails(movieId)!;
    })();

    res.status(201).json({
      success: true,
      message: "Movie created successfully",
      movie: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to create movie",
      message: err.message,
    });
  }
});

// ── PUT /movies/:id ───────────────────────────────────────────────────────────
router.put("/:id", (req: Request<IdParam>, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, error: "Invalid movie ID" });

    const existing = db.prepare(`SELECT * FROM movies WHERE id = ?`).get(id) as
      | Movie
      | undefined;
    if (!existing)
      return res.status(404).json({ success: false, error: "Movie not found" });

    const body = req.body as UpdateMovieRequest;

    const result = db.transaction(() => {
      db.prepare(
        `
  UPDATE movies SET
    title = ?, tagline = ?, description = ?, status = ?,
    release_year = ?, runtime = ?, origin_country = ?,
    original_language = ?, age_rating = ?, director = ?,
    imdb_id = ?, tmdb_id = ?, poster_url = ?, backdrop_url = ?,
    trailer_url = ?, budget = ?, box_office = ?,
    rating_imdb = ?, rating_rt = ?, rating_metacritic = ?,
    updated_at = datetime('now')
  WHERE id = ?
  `,
      ).run(
        // same order as the SET list, then id
        body.title?.trim() ?? existing.title,
        clean(body.tagline ?? existing.tagline ?? null),
        body.description?.trim() ?? existing.description ?? "",
        body.status ?? existing.status ?? "released",
        body.release_year ?? existing.release_year ?? null,
        body.runtime ?? existing.runtime ?? null,
        clean(body.origin_country ?? existing.origin_country ?? null),
        clean(body.original_language ?? existing.original_language ?? null),
        clean(body.age_rating ?? existing.age_rating ?? null),
        clean(body.director ?? existing.director ?? null),
        clean(body.imdb_id ?? existing.imdb_id ?? null),
        body.tmdb_id ?? existing.tmdb_id ?? null,
        clean(body.poster_url ?? existing.poster_url ?? null),
        clean(body.backdrop_url ?? existing.backdrop_url ?? null),
        clean(body.trailer_url ?? existing.trailer_url ?? null),
        body.budget ?? existing.budget ?? null,
        body.box_office ?? existing.box_office ?? null,
        body.rating_imdb ?? existing.rating_imdb ?? null,
        body.rating_rt ?? existing.rating_rt ?? null,
        body.rating_metacritic ?? existing.rating_metacritic ?? null,
        id, // <<< final placeholder for WHERE id = ?
      );

      if (body.language_ids !== undefined) {
        db.prepare(`DELETE FROM movie_languages WHERE movie_id = ?`).run(id);
        body.language_ids.forEach((lid) => {
          db.prepare(
            `INSERT OR IGNORE INTO movie_languages (movie_id, language_id) VALUES (?,?)`,
          ).run(id, lid);
        });
      }

      if (body.genre_ids !== undefined) {
        db.prepare(`DELETE FROM movie_genres WHERE movie_id = ?`).run(id);
        body.genre_ids.forEach((gid) => {
          db.prepare(
            `INSERT OR IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?,?)`,
          ).run(id, gid);
        });
      }

      if (body.cast !== undefined) {
        db.prepare(`DELETE FROM movie_cast WHERE movie_id = ?`).run(id);
        body.cast.forEach((c, i) => {
          const personId = upsertPerson(c);
          db.prepare(
            `
            INSERT OR IGNORE INTO movie_cast (movie_id, person_id, role, character, display_order)
            VALUES (?,?,?,?,?)
          `,
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
            `
            INSERT OR IGNORE INTO movie_companies (movie_id, company_id, role)
            VALUES (?,?,?)
          `,
          ).run(id, companyId, c.role);
        });
      }

      return getMovieWithDetails(id)!;
    })();

    res.json({
      success: true,
      message: "Movie updated successfully",
      movie: result,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to update movie",
      message: err.message,
    });
  }
});

// ── DELETE /movies/:id ────────────────────────────────────────────────────────
router.delete("/:id", (req: Request<IdParam>, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, error: "Invalid movie ID" });

    const movie = db
      .prepare(`SELECT id, title FROM movies WHERE id = ?`)
      .get(id) as Pick<Movie, "id" | "title"> | undefined;
    if (!movie)
      return res.status(404).json({ success: false, error: "Movie not found" });

    db.prepare(`DELETE FROM movies WHERE id = ?`).run(id);
    res.json({
      success: true,
      message: "Movie deleted successfully",
      deletedMovie: movie,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to delete movie",
      message: err.message,
    });
  }
});

export default router;
