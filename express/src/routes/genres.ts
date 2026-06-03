// src/routes/genres.ts
import express, { Request, Response, Router } from "express";
import db from "../db";
import type {
  Genre,
  Movie,
  MovieCard,
  Language,
  PaginationQuery,
} from "../types.ts";

const router: Router = express.Router();

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function parsePage(query: PaginationQuery) {
  const page = Math.max(1, parseInt(query.page as string) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(query.limit as string) || 20),
  );
  return { page, limit, offset: (page - 1) * limit };
}

function toMovieCards(movies: Movie[]): MovieCard[] {
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

  const watchlist = new Set(
    (
      db.prepare(`SELECT movie_id FROM watchlist`).all() as {
        movie_id: number;
      }[]
    ).map((r) => r.movie_id),
  );

  return movies.map((m) => ({
    id: m.id,
    title: m.title,
    poster_url: m.poster_url,
    backdrop_url: m.backdrop_url,
    release_year: m.release_year,
    runtime: m.runtime,
    rating_imdb: m.rating_imdb,
    age_rating: m.age_rating,
    status: m.status ?? "released",
    in_watchlist: watchlist.has(m.id),
    languages: langMap.get(m.id) ?? [],
    genres: genreMap.get(m.id) ?? [],
  }));
}

// ── Prepared statements ───────────────────────────────────────────────────────

const selectAllGenresStmt = db.prepare(
  `SELECT g.id, g.name, g.slug, g.description, g.created_at,
          COUNT(mg.movie_id) as movie_count
   FROM genres g
   LEFT JOIN movie_genres mg ON g.id = mg.genre_id
   GROUP BY g.id
   ORDER BY g.name ASC`,
);

const selectGenreBySlugStmt = db.prepare(
  `SELECT id, name, slug, description, created_at FROM genres WHERE slug = ?`,
);

const selectGenreByIdStmt = db.prepare(
  `SELECT id, name, slug, description, created_at FROM genres WHERE id = ?`,
);

const insertGenreStmt = db.prepare(
  `INSERT INTO genres (name, slug, description) VALUES (?, ?, ?)`,
);

const deleteGenreStmt = db.prepare(`DELETE FROM genres WHERE id = ?`);

const checkGenreUsageStmt = db.prepare(
  `SELECT COUNT(*) as count FROM movie_genres WHERE genre_id = ?`,
);

// ── GET /genres ───────────────────────────────────────────────────────────────
router.get("/", (_req: Request, res: Response) => {
  try {
    const genres = selectAllGenresStmt.all() as Array<
      Genre & { movie_count: number }
    >;
    res.json({ success: true, data: genres });
  } catch (err: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch genres",
        message: err.message,
      });
  }
});

// ── GET /genres/:slug/movies ──────────────────────────────────────────────────
// IMPORTANT: must be declared BEFORE /:slug to avoid being swallowed by it
router.get("/:slug/movies", (req: Request, res: Response) => {
  try {
    const genre = selectGenreBySlugStmt.get(req.params.slug) as
      | Genre
      | undefined;
    if (!genre)
      return res.status(404).json({ success: false, error: "Genre not found" });

    const { sort = "recent", year } = req.query;
    const { page, limit, offset } = parsePage(req.query as PaginationQuery);

    const conditions = [`mg.genre_id = ?`];
    const params: (string | number)[] = [genre.id];

    if (year) {
      conditions.push("m.release_year = ?");
      params.push(parseInt(year as string));
    }

    const where = conditions.join(" AND ");

    const orderMap: Record<string, string> = {
      recent: "m.created_at DESC",
      title: "m.title ASC",
      year: "m.release_year DESC",
      rating: "m.rating_imdb DESC",
    };
    const orderBy = orderMap[sort as string] ?? "m.created_at DESC";

    const { count: total } = db
      .prepare(
        `SELECT COUNT(*) as count
         FROM movies m
         JOIN movie_genres mg ON m.id = mg.movie_id
         WHERE ${where}`,
      )
      .get(...params) as { count: number };

    const movies = db
      .prepare(
        `SELECT m.*
         FROM movies m
         JOIN movie_genres mg ON m.id = mg.movie_id
         WHERE ${where}
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
      )
      .all(...params, limit, offset) as Movie[];

    const cards = toMovieCards(movies);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: { genre, movies: cards },
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (err: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch movies for genre",
        message: err.message,
      });
  }
});

// ── GET /genres/:slug ─────────────────────────────────────────────────────────
router.get("/:slug", (req: Request, res: Response) => {
  try {
    const genre = selectGenreBySlugStmt.get(req.params.slug) as
      | Genre
      | undefined;
    if (!genre)
      return res.status(404).json({ success: false, error: "Genre not found" });
    res.json({ success: true, data: genre });
  } catch (err: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch genre",
        message: err.message,
      });
  }
});

// ── POST /genres ──────────────────────────────────────────────────────────────
router.post("/", (req: Request, res: Response) => {
  try {
    const { name, slug: providedSlug, description = "" } = req.body;
    if (!name?.trim())
      return res
        .status(400)
        .json({ success: false, error: "Name is required" });

    const slug = providedSlug?.trim() ? providedSlug.trim() : toSlug(name);

    const existing = selectGenreBySlugStmt.get(slug) as Genre | undefined;
    if (existing)
      return res
        .status(409)
        .json({ success: false, error: "Genre slug already exists", existing });

    const info = insertGenreStmt.run(name.trim(), slug, description.trim());
    const genre = selectGenreByIdStmt.get(info.lastInsertRowid) as Genre;
    res
      .status(201)
      .json({
        success: true,
        message: "Genre created successfully",
        data: genre,
      });
  } catch (err: any) {
    if (err.message.includes("UNIQUE constraint failed"))
      return res
        .status(409)
        .json({ success: false, error: "Genre name or slug already exists" });
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to create genre",
        message: err.message,
      });
  }
});

// ── PUT /genres/:slug ─────────────────────────────────────────────────────────
router.put("/:slug", (req: Request, res: Response) => {
  try {
    const existing = selectGenreBySlugStmt.get(req.params.slug) as
      | Genre
      | undefined;
    if (!existing)
      return res.status(404).json({ success: false, error: "Genre not found" });

    const { name, slug, description } = req.body;
    const updatedName = name?.trim() ?? existing.name;
    const updatedSlug = slug?.trim() ?? existing.slug;
    const updatedDesc = description?.trim() ?? existing.description ?? "";

    if (!updatedName)
      return res
        .status(400)
        .json({ success: false, error: "Name cannot be empty" });

    db.prepare(
      `UPDATE genres SET name = ?, slug = ?, description = ? WHERE id = ?`,
    ).run(updatedName, updatedSlug, updatedDesc, existing.id);

    const genre = selectGenreByIdStmt.get(existing.id) as Genre;
    res.json({
      success: true,
      message: "Genre updated successfully",
      data: genre,
    });
  } catch (err: any) {
    if (err.message.includes("UNIQUE constraint failed"))
      return res
        .status(409)
        .json({ success: false, error: "Genre name or slug already exists" });
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to update genre",
        message: err.message,
      });
  }
});

// ── DELETE /genres/:slug ──────────────────────────────────────────────────────
router.delete("/:slug", (req: Request, res: Response) => {
  try {
    const genre = selectGenreBySlugStmt.get(req.params.slug) as
      | Genre
      | undefined;
    if (!genre)
      return res.status(404).json({ success: false, error: "Genre not found" });

    const { count } = checkGenreUsageStmt.get(genre.id) as { count: number };
    if (count > 0)
      return res.status(409).json({
        success: false,
        error: "Cannot delete a genre that is assigned to movies",
        usedBy: count,
      });

    deleteGenreStmt.run(genre.id);
    res.json({
      success: true,
      message: "Genre deleted successfully",
      data: { id: genre.id, name: genre.name },
    });
  } catch (err: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to delete genre",
        message: err.message,
      });
  }
});

export default router;
