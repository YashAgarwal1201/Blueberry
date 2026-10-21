// src/routes/languages.ts

import { Hono } from "hono";
import db, { languages, movieLanguages } from "../db";
import { eq, sql, asc } from "drizzle-orm";
import type { Language, Genre, Movie } from "shared-types";
import { getErrorMessage } from "../utils/errors";
import { requireAuth, requireModerator } from "../middleware/authMiddleware";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// ── Drizzle Queries ───────────────────────────────────────────────────────────

function selectAllLanguages(): Language[] {
  return db
    .select({
      id: languages.id,
      name: languages.name,
      code: languages.code,
      native_script: languages.native_script,
      movie_count: sql<number>`COUNT(${movieLanguages.movie_id})`,
    })
    .from(languages)
    .leftJoin(movieLanguages, eq(languages.id, movieLanguages.language_id))
    .groupBy(languages.id)
    .orderBy(asc(languages.name))
    .all() as unknown as Language[];
}

function selectLanguageById(id: number): Language | undefined {
  return (
    db
      .select({
        id: languages.id,
        name: languages.name,
        code: languages.code,
        native_script: languages.native_script,
      })
      .from(languages)
      .where(eq(languages.id, id))
      .get() as Language | undefined
  );
}

function selectLanguageByCode(code: string): Language | undefined {
  return (
    db
      .select({
        id: languages.id,
        name: languages.name,
        code: languages.code,
        native_script: languages.native_script,
      })
      .from(languages)
      .where(eq(languages.code, code))
      .get() as Language | undefined
  );
}

function insertLanguage(name: string, code: string) {
  return db
    .insert(languages)
    .values({ name, code })
    .run();
}

function updateLanguage(id: number, name: string, code: string) {
  return db
    .update(languages)
    .set({ name, code })
    .where(eq(languages.id, id))
    .run();
}

function deleteLanguage(id: number) {
  return db
    .delete(languages)
    .where(eq(languages.id, id))
    .run();
}

function checkLanguageUsage(id: number): { count: number } {
  const row = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(movieLanguages)
    .where(eq(movieLanguages.language_id, id))
    .get();
  return { count: row ? Number(row.count) : 0 };
}

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

function attachDataToMovies(movies: Movie[]) {
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

router.get("/", (c) => {
  try {
    const nocache = c.req.query("nocache");

    if (!nocache) {
      const cached = languageCache.get("all");
      if (cached) {
        return c.json({
          success: true,
          data: cached,
        });
      }
    }

    const languages = selectAllLanguages();
    languageCache.set("all", languages);

    return c.json({
      success: true,
      data: languages,
    });
  } catch (err: unknown) {
    console.error("Error fetching languages:", err);
    return c.json({
      success: false,
      error: "Failed to fetch languages",
      message: getErrorMessage(err),
    }, 500);
  }
});

// ── GET /languages/:code/sections ─────────────────────────────────────────────
// Declared BEFORE /:code/movies and /:id
router.get("/:code/sections", (c) => {
  try {
    const code = c.req.param("code");
    const language = selectLanguageByCode(code.toLowerCase());
    if (!language)
      return c.json({ success: false, error: "Language not found" }, 404);

    const rawMovies = db
      .prepare(
        `SELECT m.*
         FROM movies m
         JOIN movie_languages ml ON m.id = ml.movie_id
         WHERE ml.language_id = ?
         ORDER BY m.created_at DESC`
      )
      .all(language.id) as Movie[];

    const movies = attachDataToMovies(rawMovies);

    // Group by genre
    const sectionMap = new Map<string, {
      genre: { id: number; name: string; slug: string; description?: string | null };
      movies: typeof movies;
    }>();

    for (const movie of movies) {
      for (const genre of movie.genres) {
        if (!sectionMap.has(genre.slug)) {
          sectionMap.set(genre.slug, { genre, movies: [] });
        }
        sectionMap.get(genre.slug)!.movies.push(movie);
      }
    }

    const sections = [...sectionMap.values()]
      .sort((a, b) => b.movies.length - a.movies.length);

    return c.json({ success: true, data: { language, sections } });
  } catch (err: unknown) {
    console.error("Error fetching language sections:", err);
    return c.json({ success: false, error: "Failed to fetch language content", message: getErrorMessage(err) }, 500);
  }
});

// ── GET /languages/:code/movies ───────────────────────────────────────────────
// Declared BEFORE /:id to prevent matching /en/movies as /:id

router.get("/:code/movies", (c) => {
  try {
    const code = c.req.param("code");
    const year = c.req.query("year");
    const sort = c.req.query("sort") ?? "recent";

    const language = selectLanguageByCode(code?.toLowerCase() || "");
    if (!language)
      return c.json({ success: false, error: "Language not found" }, 404);

    // Build WHERE and ORDER BY in SQL — no in-memory filtering
    const conditions = [`ml.language_id = ?`];
    const params: (string | number)[] = [language.id];

    if (year) {
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
    const orderBy = orderMap[sort] ?? "m.created_at DESC";

    const movies = db
      .prepare(
        `SELECT m.*
         FROM movies m
         JOIN movie_languages ml ON m.id = ml.movie_id
         WHERE ${conditions.join(" AND ")}
         ORDER BY ${orderBy}`,
      )
      .all(...params) as Movie[];

    const result = attachDataToMovies(movies);

    return c.json({ success: true, data: { language, movies: result } });
  } catch (err: unknown) {
    console.error("Error fetching movies by language:", err);
    return c.json({
      success: false,
      error: "Failed to fetch movies for language",
      message: getErrorMessage(err),
    }, 500);
  }
});

// ── GET /languages/:id ────────────────────────────────────────────────────────

router.get("/:id", (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id))
      return c.json({ success: false, error: "Invalid language ID" }, 400);

    const language = selectLanguageById(id);
    if (!language)
      return c.json({ success: false, error: "Language not found" }, 404);

    return c.json({ success: true, data: language });
  } catch (err: unknown) {
    console.error("Error fetching language:", err);
    return c.json({
      success: false,
      error: "Failed to fetch language",
      message: getErrorMessage(err),
    }, 500);
  }
});

// ── POST /languages ───────────────────────────────────────────────────────────
router.post("/", requireAuth, async (c) => {
  try {
    const body = await c.req.json<{ name?: string; code?: string }>().catch(() => ({} as { name?: string; code?: string }));
    const { name, code } = body;

    if (!name || !code)
      return c.json({ success: false, error: "Name and code are required" }, 400);

    if (name.trim().length === 0 || code.trim().length === 0)
      return c.json({ success: false, error: "Name and code cannot be empty" }, 400);

    const codeRegex = /^[a-z]{2,3}$/;
    if (!codeRegex.test(code.trim()))
      return c.json({
        success: false,
        error: "Code must be 2-3 lowercase letters (ISO 639-1/639-2)",
      }, 400);

    const existing = selectLanguageByCode(code.trim());
    if (existing)
      return c.json({
        success: false,
        error: "Language code already exists",
        existing,
      }, 409);

    const info = insertLanguage(name.trim(), code.trim().toLowerCase());
    const languageId = info.lastInsertRowid as number;
    const language = selectLanguageById(languageId) as Language;
    languageCache.invalidate();

    return c.json({
      success: true,
      message: "Language added successfully",
      data: language,
    }, 201);
  } catch (err: unknown) {
    console.error("Error adding language:", err);
    const msg = getErrorMessage(err);
    if (msg.includes("UNIQUE constraint failed"))
      return c.json({
        success: false,
        error: "Language name or code already exists",
      }, 409);
    return c.json({
      success: false,
      error: "Failed to add language",
      message: msg,
    }, 500);
  }
});

// ── PUT /languages/:id ────────────────────────────────────────────────────────
router.put("/:id", requireAuth, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id))
      return c.json({ success: false, error: "Invalid language ID" }, 400);

    const existing = selectLanguageById(id);
    if (!existing)
      return c.json({ success: false, error: "Language not found" }, 404);

    const body = await c.req.json<{ name?: string; code?: string }>().catch(() => ({} as { name?: string; code?: string }));
    const { name, code } = body;
    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedCode =
      code !== undefined ? code.trim().toLowerCase() : existing.code;

    if (updatedName.length === 0 || updatedCode.length === 0)
      return c.json({ success: false, error: "Name and code cannot be empty" }, 400);

    const codeRegex = /^[a-z]{2,3}$/;
    if (!codeRegex.test(updatedCode))
      return c.json({
        success: false,
        error: "Code must be 2-3 lowercase letters (ISO 639-1/639-2)",
      }, 400);

    updateLanguage(id, updatedName, updatedCode);
    const language = selectLanguageById(id) as Language;
    languageCache.invalidate();

    return c.json({
      success: true,
      message: "Language updated successfully",
      data: language,
    });
  } catch (err: unknown) {
    console.error("Error updating language:", err);
    const msg = getErrorMessage(err);
    if (msg.includes("UNIQUE constraint failed"))
      return c.json({
        success: false,
        error: "Language name or code already exists",
      }, 409);
    return c.json({
      success: false,
      error: "Failed to update language",
      message: msg,
    }, 500);
  }
});

// ── DELETE /languages/:id ─────────────────────────────────────────────────────
router.delete("/:id", requireModerator, (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id))
      return c.json({ success: false, error: "Invalid language ID" }, 400);

    const language = selectLanguageById(id);
    if (!language)
      return c.json({ success: false, error: "Language not found" }, 404);

    const usage = checkLanguageUsage(id);
    if (usage.count > 0)
      return c.json({
        success: false,
        error: "Cannot delete language that is used by movies",
        usedBy: usage.count,
      }, 409);

    deleteLanguage(id);
    languageCache.invalidate();

    return c.json({
      success: true,
      message: "Language deleted successfully",
      data: { id: language.id, name: language.name },
    });
  } catch (err: unknown) {
    console.error("Error deleting language:", err);
    return c.json({
      success: false,
      error: "Failed to delete language",
      message: getErrorMessage(err),
    }, 500);
  }
});

export default router;
