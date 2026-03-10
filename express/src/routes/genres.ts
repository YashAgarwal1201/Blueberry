// src/routes/genres.ts
import express, { Request, Response, Router } from "express";
import db from "../db";
import { Genre, Movie, Language } from "../types.ts";

const router: Router = express.Router();

// ── Prepared statements ──────────────────────────────────────────────────────

const selectAllGenresStmt = db.prepare(`
  SELECT id, name, slug, description, created_at
  FROM genres ORDER BY name ASC
`);

const selectGenreByIdStmt = db.prepare(`
  SELECT id, name, slug, description, created_at FROM genres WHERE id = ?
`);

const selectGenreBySlugStmt = db.prepare(`
  SELECT id, name, slug, description, created_at FROM genres WHERE slug = ?
`);

const insertGenreStmt = db.prepare(`
  INSERT INTO genres (name, slug, description) VALUES (?, ?, ?)
`);

const updateGenreStmt = db.prepare(`
  UPDATE genres SET name = ?, slug = ?, description = ? WHERE id = ?
`);

const deleteGenreStmt = db.prepare(`
  DELETE FROM genres WHERE id = ?
`);

const checkGenreUsageStmt = db.prepare(`
  SELECT COUNT(*) as count FROM movie_genres WHERE genre_id = ?
`);

// ── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function attachDataToMovies(movies: Movie[]) {
  if (movies.length === 0) return [];
  const ids = movies.map((m) => m.id);
  const ph = ids.map(() => "?").join(",");

  const langs = db
    .prepare(
      `
    SELECT ml.movie_id, l.id, l.name, l.code
    FROM languages l
    INNER JOIN movie_languages ml ON l.id = ml.language_id
    WHERE ml.movie_id IN (${ph})
  `,
    )
    .all(...ids) as Array<Language & { movie_id: number }>;

  const genres = db
    .prepare(
      `
    SELECT mg.movie_id, g.id, g.name, g.slug, g.description, g.created_at
    FROM genres g
    INNER JOIN movie_genres mg ON g.id = mg.genre_id
    WHERE mg.movie_id IN (${ph})
  `,
    )
    .all(...ids) as Array<Genre & { movie_id: number }>;

  const langMap = new Map<number, Language[]>();
  langs.forEach(({ movie_id, ...l }) => {
    if (!langMap.has(movie_id)) langMap.set(movie_id, []);
    langMap.get(movie_id)!.push(l);
  });

  const genreMap = new Map<number, Genre[]>();
  genres.forEach(({ movie_id, ...g }) => {
    if (!genreMap.has(movie_id)) genreMap.set(movie_id, []);
    genreMap.get(movie_id)!.push(g);
  });

  return movies.map((m) => ({
    ...m,
    languages: langMap.get(m.id) || [],
    genres: genreMap.get(m.id) || [],
  }));
}

// ── Routes ───────────────────────────────────────────────────────────────────

// GET /genres
router.get("/", (_req: Request, res: Response) => {
  try {
    const genres = selectAllGenresStmt.all() as Genre[];
    // Attach movie count to each genre for display
    const withCounts = genres.map((g) => {
      const { count } = db
        .prepare(
          `SELECT COUNT(*) as count FROM movie_genres WHERE genre_id = ?`,
        )
        .get(g.id) as { count: number };
      return { ...g, movie_count: count };
    });
    res.json({ success: true, count: genres.length, genres: withCounts });
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

// GET /genres/:slug
router.get("/:slug", (req: Request, res: Response) => {
  try {
    const genre = selectGenreBySlugStmt.get(req.params.slug) as
      | Genre
      | undefined;
    if (!genre)
      return res.status(404).json({ success: false, error: "Genre not found" });
    res.json({ success: true, genre });
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

// GET /genres/:slug/movies — movies for a genre with filters
router.get("/:slug/movies", (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { year, sort = "recent" } = req.query;

    const genre = selectGenreBySlugStmt.get(slug) as Genre | undefined;
    if (!genre)
      return res.status(404).json({ success: false, error: "Genre not found" });

    let movies = db
      .prepare(
        `
      SELECT m.id, m.title, m.description, m.release_year, m.director,
             m.poster_url, m.runtime, m.created_at, m.updated_at
      FROM movies m
      INNER JOIN movie_genres mg ON m.id = mg.movie_id
      WHERE mg.genre_id = ?
      ORDER BY m.created_at DESC
    `,
      )
      .all(genre.id) as Movie[];

    if (year && typeof year === "string") {
      const y = parseInt(year);
      if (!isNaN(y)) movies = movies.filter((m) => m.release_year === y);
    }

    let result = attachDataToMovies(movies);

    if (sort === "title") result.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === "year")
      result.sort((a, b) => (b.release_year || 0) - (a.release_year || 0));

    res.json({ success: true, genre, count: result.length, movies: result });
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

// POST /genres
router.post("/", (req: Request, res: Response) => {
  try {
    const { name, slug: providedSlug, description = "" } = req.body;
    if (!name?.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Name is required" });
    }

    const slug = providedSlug?.trim() ? providedSlug.trim() : toSlug(name);

    const existing = selectGenreBySlugStmt.get(slug) as Genre | undefined;
    if (existing) {
      return res
        .status(409)
        .json({ success: false, error: "Genre slug already exists", existing });
    }

    const info = insertGenreStmt.run(name.trim(), slug, description.trim());
    const genre = selectGenreByIdStmt.get(info.lastInsertRowid) as Genre;
    res
      .status(201)
      .json({ success: true, message: "Genre created successfully", genre });
  } catch (err: any) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res
        .status(409)
        .json({ success: false, error: "Genre name or slug already exists" });
    }
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to create genre",
        message: err.message,
      });
  }
});

// PUT /genres/:slug
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

    updateGenreStmt.run(updatedName, updatedSlug, updatedDesc, existing.id);
    const genre = selectGenreByIdStmt.get(existing.id) as Genre;
    res.json({ success: true, message: "Genre updated successfully", genre });
  } catch (err: any) {
    if (err.message.includes("UNIQUE constraint failed")) {
      return res
        .status(409)
        .json({ success: false, error: "Genre name or slug already exists" });
    }
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to update genre",
        message: err.message,
      });
  }
});

// DELETE /genres/:slug
router.delete("/:slug", (req: Request, res: Response) => {
  try {
    const genre = selectGenreBySlugStmt.get(req.params.slug) as
      | Genre
      | undefined;
    if (!genre)
      return res.status(404).json({ success: false, error: "Genre not found" });

    const { count } = checkGenreUsageStmt.get(genre.id) as { count: number };
    if (count > 0) {
      return res.status(409).json({
        success: false,
        error: "Cannot delete a genre that is assigned to movies",
        usedBy: count,
      });
    }

    deleteGenreStmt.run(genre.id);
    res.json({
      success: true,
      message: "Genre deleted successfully",
      deletedGenre: { id: genre.id, name: genre.name },
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
