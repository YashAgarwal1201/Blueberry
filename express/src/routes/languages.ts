// src/routes/languages.ts

import express, { Request, Response, Router } from "express";
import db from "../db";
import { CodeParam, Language, Genre } from "../types.ts";

const router: Router = express.Router();

interface IdParam {
  id: string;
}

// ── Prepared statements ───────────────────────────────────────────────────────

const selectAllLanguagesStmt = db.prepare(`
  SELECT l.id, l.name, l.code, l.native_script,
         COUNT(ml.movie_id) as movie_count
  FROM languages l
  LEFT JOIN movie_languages ml ON l.id = ml.language_id
  GROUP BY l.id
  ORDER BY l.name ASC
`);

const selectLanguageByIdStmt = db.prepare(`
  SELECT id, name, code, native_script FROM languages WHERE id = ?
`);

const selectLanguageByCodeStmt = db.prepare(`
  SELECT id, name, code, native_script FROM languages WHERE code = ?
`);

const insertLanguageStmt = db.prepare(`
  INSERT INTO languages (name, code) VALUES (?, ?)
`);

const updateLanguageStmt = db.prepare(`
  UPDATE languages SET name = ?, code = ? WHERE id = ?
`);

const deleteLanguageStmt = db.prepare(`
  DELETE FROM languages WHERE id = ?
`);

const checkLanguageUsageStmt = db.prepare(`
  SELECT COUNT(*) as count FROM movie_languages WHERE language_id = ?
`);

// ── Cache ─────────────────────────────────────────────────────────────────────

class LanguageCache {
  private cache: Map<string, { data: Language[]; timestamp: number }> =
    new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  get(key: string): Language[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  set(key: string, data: Language[]): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  invalidate(): void {
    this.cache.clear();
  }
}

const languageCache = new LanguageCache();

// ── Helpers ───────────────────────────────────────────────────────────────────

function attachDataToMovies(movies: any[]) {
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
    .all(...ids) as Array<Language & { movie_id: number }>;

  const allGenres = db
    .prepare(
      `SELECT mg.movie_id, g.id, g.name, g.slug, g.description, g.created_at
       FROM genres g
       JOIN movie_genres mg ON g.id = mg.genre_id
       WHERE mg.movie_id IN (${ph})`,
    )
    .all(...ids) as Array<Genre & { movie_id: number }>;

  const langMap = new Map<number, Language[]>();
  const genreMap = new Map<number, Genre[]>();

  allLangs.forEach(({ movie_id, ...l }) => {
    if (!langMap.has(movie_id)) langMap.set(movie_id, []);
    langMap.get(movie_id)!.push(l as Language);
  });
  allGenres.forEach(({ movie_id, ...g }) => {
    if (!genreMap.has(movie_id)) genreMap.set(movie_id, []);
    genreMap.get(movie_id)!.push(g as Genre);
  });

  return movies.map((m) => ({
    ...m,
    languages: langMap.get(m.id) ?? [],
    genres: genreMap.get(m.id) ?? [],
  }));
}

// ── GET /languages ────────────────────────────────────────────────────────────

router.get("/", (req: Request, res: Response) => {
  try {
    const { nocache } = req.query;

    if (!nocache) {
      const cached = languageCache.get("all");
      if (cached) {
        return res.json({
          success: true,
          count: cached.length,
          languages: cached,
          cached: true,
        });
      }
    }

    const languages = selectAllLanguagesStmt.all() as Language[];
    languageCache.set("all", languages);

    res.json({
      success: true,
      count: languages.length,
      languages,
      cached: false,
    });
  } catch (err: any) {
    console.error("Error fetching languages:", err);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch languages",
        message: err.message,
      });
  }
});

// ── GET /languages/:code/movies ───────────────────────────────────────────────
// Declared BEFORE /:id to prevent Express matching /en/movies as /:id

router.get("/:code/movies", (req: Request<CodeParam>, res: Response) => {
  try {
    const { code } = req.params;
    const { year, sort = "recent" } = req.query;

    const language = selectLanguageByCodeStmt.get(code?.toLowerCase()) as
      | Language
      | undefined;
    if (!language)
      return res
        .status(404)
        .json({ success: false, error: "Language not found" });

    // Build WHERE and ORDER BY in SQL — no in-memory filtering
    const conditions = [`ml.language_id = ?`];
    const params: (string | number)[] = [language.id];

    if (year && typeof year === "string") {
      const y = parseInt(year);
      if (!isNaN(y)) {
        conditions.push("m.release_year = ?");
        params.push(y);
      }
    }

    const orderMap: Record<string, string> = {
      recent: "m.created_at DESC",
      title: "m.title ASC",
      year: "m.release_year DESC",
      rating: "m.rating_imdb DESC",
    };
    const orderBy = orderMap[sort as string] ?? "m.created_at DESC";

    const movies = db
      .prepare(
        `SELECT m.*
         FROM movies m
         JOIN movie_languages ml ON m.id = ml.movie_id
         WHERE ${conditions.join(" AND ")}
         ORDER BY ${orderBy}`,
      )
      .all(...params) as any[];

    const result = attachDataToMovies(movies);

    res.json({ success: true, language, count: result.length, movies: result });
  } catch (err: any) {
    console.error("Error fetching movies by language:", err);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch movies for language",
        message: err.message,
      });
  }
});

// ── GET /languages/:id ────────────────────────────────────────────────────────

router.get("/:id", (req: Request<IdParam>, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, error: "Invalid language ID" });

    const language = selectLanguageByIdStmt.get(id) as Language | undefined;
    if (!language)
      return res
        .status(404)
        .json({ success: false, error: "Language not found" });

    res.json({ success: true, language });
  } catch (err: any) {
    console.error("Error fetching language:", err);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch language",
        message: err.message,
      });
  }
});

// ── POST /languages ───────────────────────────────────────────────────────────

router.post("/", (req: Request, res: Response) => {
  try {
    const { name, code } = req.body;

    if (!name || !code)
      return res
        .status(400)
        .json({ success: false, error: "Name and code are required" });

    if (name.trim().length === 0 || code.trim().length === 0)
      return res
        .status(400)
        .json({ success: false, error: "Name and code cannot be empty" });

    const codeRegex = /^[a-z]{2,3}$/;
    if (!codeRegex.test(code.trim()))
      return res
        .status(400)
        .json({
          success: false,
          error: "Code must be 2-3 lowercase letters (ISO 639-1/639-2)",
        });

    const existing = selectLanguageByCodeStmt.get(code.trim()) as
      | Language
      | undefined;
    if (existing)
      return res
        .status(409)
        .json({
          success: false,
          error: "Language code already exists",
          existing,
        });

    const info = insertLanguageStmt.run(name.trim(), code.trim().toLowerCase());
    const languageId = info.lastInsertRowid as number;
    const language = selectLanguageByIdStmt.get(languageId) as Language;
    languageCache.invalidate();

    res
      .status(201)
      .json({
        success: true,
        message: "Language added successfully",
        language,
      });
  } catch (err: any) {
    console.error("Error adding language:", err);
    if (err.message.includes("UNIQUE constraint failed"))
      return res
        .status(409)
        .json({
          success: false,
          error: "Language name or code already exists",
        });
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to add language",
        message: err.message,
      });
  }
});

// ── PUT /languages/:id ────────────────────────────────────────────────────────

router.put("/:id", (req: Request<IdParam>, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, error: "Invalid language ID" });

    const existing = selectLanguageByIdStmt.get(id) as Language | undefined;
    if (!existing)
      return res
        .status(404)
        .json({ success: false, error: "Language not found" });

    const { name, code } = req.body;
    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedCode =
      code !== undefined ? code.trim().toLowerCase() : existing.code;

    if (updatedName.length === 0 || updatedCode.length === 0)
      return res
        .status(400)
        .json({ success: false, error: "Name and code cannot be empty" });

    const codeRegex = /^[a-z]{2,3}$/;
    if (!codeRegex.test(updatedCode))
      return res
        .status(400)
        .json({
          success: false,
          error: "Code must be 2-3 lowercase letters (ISO 639-1/639-2)",
        });

    updateLanguageStmt.run(updatedName, updatedCode, id);
    const language = selectLanguageByIdStmt.get(id) as Language;
    languageCache.invalidate();

    res.json({
      success: true,
      message: "Language updated successfully",
      language,
    });
  } catch (err: any) {
    console.error("Error updating language:", err);
    if (err.message.includes("UNIQUE constraint failed"))
      return res
        .status(409)
        .json({
          success: false,
          error: "Language name or code already exists",
        });
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to update language",
        message: err.message,
      });
  }
});

// ── DELETE /languages/:id ─────────────────────────────────────────────────────

router.delete("/:id", (req: Request<IdParam>, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, error: "Invalid language ID" });

    const language = selectLanguageByIdStmt.get(id) as Language | undefined;
    if (!language)
      return res
        .status(404)
        .json({ success: false, error: "Language not found" });

    const usage = checkLanguageUsageStmt.get(id) as { count: number };
    if (usage.count > 0)
      return res
        .status(409)
        .json({
          success: false,
          error: "Cannot delete language that is used by movies",
          usedBy: usage.count,
        });

    deleteLanguageStmt.run(id);
    languageCache.invalidate();

    res.json({
      success: true,
      message: "Language deleted successfully",
      deletedLanguage: { id: language.id, name: language.name },
    });
  } catch (err: any) {
    console.error("Error deleting language:", err);
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to delete language",
        message: err.message,
      });
  }
});

export default router;
