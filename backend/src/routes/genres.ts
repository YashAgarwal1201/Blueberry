// src/routes/genres.ts
import { Hono } from "hono";
import db, {
  genres as genresTable,
  movieGenres as movieGenresTable,
  languages as languagesTable,
  movieLanguages as movieLanguagesTable,
  movies as moviesTable,
} from "../db";
import { eq, inArray, asc, desc, sql, and } from "drizzle-orm";
import { resolveImage } from "../utils/imageUtils";
import { getMovieWatchlistSet } from "../utils/watchlistCache";
import { getErrorMessage } from "../utils/errors";
import type {
  Genre,
  Movie,
  MovieCard,
} from "shared-types";
import { requireAuth, requireModerator } from "../middleware/authMiddleware";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function parsePage(query: Record<string, string | undefined>) {
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

  const allLangs = db
    .select({
      movie_id: movieLanguagesTable.movie_id,
      id: languagesTable.id,
      name: languagesTable.name,
      code: languagesTable.code,
    })
    .from(languagesTable)
    .innerJoin(
      movieLanguagesTable,
      eq(languagesTable.id, movieLanguagesTable.language_id),
    )
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
    .innerJoin(
      movieGenresTable,
      eq(genresTable.id, movieGenresTable.genre_id),
    )
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

  const watchlist = getMovieWatchlistSet();

  return movies.map((m) => ({
    id: m.id,
    uuid: m.uuid,
    type: "movie",
    title: m.title,
    poster_url:
      resolveImage(m.tmdb_poster_path, m.local_poster_url) || m.poster_url,
    backdrop_url:
      resolveImage(m.tmdb_backdrop_path, m.local_backdrop_url, "w780") ||
      m.backdrop_url,
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

// ── GET /genres ───────────────────────────────────────────────────────────────
router.get("/", (c) => {
  try {
    const genres = db
      .select({
        id: genresTable.id,
        name: genresTable.name,
        slug: genresTable.slug,
        description: genresTable.description,
        created_at: genresTable.created_at,
        movie_count: sql<number>`COUNT(${movieGenresTable.movie_id})`,
      })
      .from(genresTable)
      .leftJoin(
        movieGenresTable,
        eq(genresTable.id, movieGenresTable.genre_id),
      )
      .groupBy(genresTable.id)
      .orderBy(asc(genresTable.name))
      .all() as Array<Genre & { movie_count: number }>;

    return c.json({ success: true, data: genres });
  } catch (err: unknown) {
    return c.json(
      {
        success: false,
        error: "Failed to fetch genres",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

// ── GET /genres/:slug/sections ──────────────────────────────────────────────────
// IMPORTANT: must be declared BEFORE /:slug/movies and /:slug
router.get("/:slug/sections", (c) => {
  try {
    const slug = c.req.param("slug");
    const genre = db
      .select()
      .from(genresTable)
      .where(eq(genresTable.slug, slug))
      .get() as Genre | undefined;

    if (!genre)
      return c.json({ success: false, error: "Genre not found" }, 404);

    const rawMovies = db
      .select({
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
      })
      .from(moviesTable)
      .innerJoin(
        movieGenresTable,
        eq(moviesTable.id, movieGenresTable.movie_id),
      )
      .where(eq(movieGenresTable.genre_id, genre.id))
      .orderBy(desc(moviesTable.created_at))
      .all() as unknown as Movie[];

    const movies = toMovieCards(rawMovies);

    // Group by language
    const sectionMap = new Map<
      string,
      {
        language: {
          id: number;
          name: string;
          code: string;
          native_script?: string | null;
        };
        movies: typeof movies;
      }
    >();

    for (const movie of movies) {
      for (const lang of movie.languages) {
        if (!sectionMap.has(lang.code)) {
          sectionMap.set(lang.code, { language: lang, movies: [] });
        }
        sectionMap.get(lang.code)!.movies.push(movie);
      }
    }

    const sections = [...sectionMap.values()].sort(
      (a, b) => b.movies.length - a.movies.length,
    );

    return c.json({ success: true, data: { genre, sections } });
  } catch (err: unknown) {
    return c.json(
      {
        success: false,
        error: "Failed to fetch genre sections",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

// ── GET /genres/:slug/movies ──────────────────────────────────────────────────
// IMPORTANT: must be declared BEFORE /:slug to avoid being swallowed by it
router.get("/:slug/movies", (c) => {
  try {
    const slug = c.req.param("slug");
    const genre = db
      .select()
      .from(genresTable)
      .where(eq(genresTable.slug, slug))
      .get() as Genre | undefined;

    if (!genre)
      return c.json({ success: false, error: "Genre not found" }, 404);

    const sort = c.req.query("sort") ?? "recent";
    const year = c.req.query("year");
    const { page, limit, offset } = parsePage(c.req.query());

    const conditions = [eq(movieGenresTable.genre_id, genre.id)];

    if (year) {
      const y = parseInt(year);
      if (!isNaN(y)) {
        conditions.push(eq(moviesTable.release_year, y));
      }
    }

    const whereClause = and(...conditions);

    const orderClause =
      sort === "title"
        ? asc(moviesTable.title)
        : sort === "year"
          ? desc(moviesTable.release_year)
          : sort === "rating"
            ? desc(moviesTable.rating_imdb)
            : desc(moviesTable.created_at);

    const totalRow = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(moviesTable)
      .innerJoin(
        movieGenresTable,
        eq(moviesTable.id, movieGenresTable.movie_id),
      )
      .where(whereClause)
      .get();

    const total = totalRow ? Number(totalRow.count) : 0;

    const movies = db
      .select({
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
      })
      .from(moviesTable)
      .innerJoin(
        movieGenresTable,
        eq(moviesTable.id, movieGenresTable.movie_id),
      )
      .where(whereClause)
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset)
      .all() as unknown as Movie[];

    const cards = toMovieCards(movies);
    const totalPages = Math.ceil(total / limit);

    return c.json({
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
  } catch (err: unknown) {
    return c.json(
      {
        success: false,
        error: "Failed to fetch movies for genre",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

// ── GET /genres/:slug ─────────────────────────────────────────────────────────
router.get("/:slug", (c) => {
  try {
    const slug = c.req.param("slug");
    const genre = db
      .select()
      .from(genresTable)
      .where(eq(genresTable.slug, slug))
      .get() as Genre | undefined;

    if (!genre)
      return c.json({ success: false, error: "Genre not found" }, 404);
    return c.json({ success: true, data: genre });
  } catch (err: unknown) {
    return c.json(
      {
        success: false,
        error: "Failed to fetch genre",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

// ── POST /genres ──────────────────────────────────────────────────────────────
router.post("/", requireAuth, async (c) => {
  try {
    const body = await c.req
      .json<{ name?: string; slug?: string; description?: string }>()
      .catch(
        () => ({} as { name?: string; slug?: string; description?: string }),
      );
    const { name, slug: providedSlug, description = "" } = body;
    if (!name?.trim())
      return c.json({ success: false, error: "Name is required" }, 400);

    const slug = providedSlug?.trim() ? providedSlug.trim() : toSlug(name);

    const existing = db
      .select()
      .from(genresTable)
      .where(eq(genresTable.slug, slug))
      .get() as Genre | undefined;

    if (existing)
      return c.json(
        { success: false, error: "Genre slug already exists", existing },
        409,
      );

    const info = db
      .insert(genresTable)
      .values({
        name: name.trim(),
        slug,
        description: description.trim(),
      })
      .run();

    const genre = db
      .select()
      .from(genresTable)
      .where(eq(genresTable.id, Number(info.lastInsertRowid)))
      .get() as Genre;

    return c.json(
      {
        success: true,
        message: "Genre created successfully",
        data: genre,
      },
      201,
    );
  } catch (err: unknown) {
    const msg = getErrorMessage(err);
    if (msg.includes("UNIQUE constraint failed"))
      return c.json(
        { success: false, error: "Genre name or slug already exists" },
        409,
      );
    return c.json(
      {
        success: false,
        error: "Failed to create genre",
        message: msg,
      },
      500,
    );
  }
});

// ── PUT /genres/:slug ─────────────────────────────────────────────────────────
router.put("/:slug", requireAuth, async (c) => {
  try {
    const slugParam = c.req.param("slug");
    const existing = db
      .select()
      .from(genresTable)
      .where(eq(genresTable.slug, slugParam))
      .get() as Genre | undefined;

    if (!existing)
      return c.json({ success: false, error: "Genre not found" }, 404);

    const body = await c.req
      .json<{ name?: string; slug?: string; description?: string }>()
      .catch(
        () => ({} as { name?: string; slug?: string; description?: string }),
      );
    const { name, slug, description } = body;
    const updatedName = name?.trim() ?? existing.name;
    const updatedSlug = slug?.trim() ?? existing.slug;
    const updatedDesc = description?.trim() ?? existing.description ?? "";

    if (!updatedName)
      return c.json({ success: false, error: "Name cannot be empty" }, 400);

    db.update(genresTable)
      .set({
        name: updatedName,
        slug: updatedSlug,
        description: updatedDesc,
      })
      .where(eq(genresTable.id, existing.id))
      .run();

    const genre = db
      .select()
      .from(genresTable)
      .where(eq(genresTable.id, existing.id))
      .get() as Genre;

    return c.json({
      success: true,
      message: "Genre updated successfully",
      data: genre,
    });
  } catch (err: unknown) {
    const msg = getErrorMessage(err);
    if (msg.includes("UNIQUE constraint failed"))
      return c.json(
        { success: false, error: "Genre name or slug already exists" },
        409,
      );
    return c.json(
      {
        success: false,
        error: "Failed to update genre",
        message: msg,
      },
      500,
    );
  }
});

// ── DELETE /genres/:slug ──────────────────────────────────────────────────────
router.delete("/:slug", requireModerator, (c) => {
  try {
    const slugParam = c.req.param("slug");
    const genre = db
      .select()
      .from(genresTable)
      .where(eq(genresTable.slug, slugParam))
      .get() as Genre | undefined;

    if (!genre)
      return c.json({ success: false, error: "Genre not found" }, 404);

    const usage = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(movieGenresTable)
      .where(eq(movieGenresTable.genre_id, genre.id))
      .get();

    const count = usage ? Number(usage.count) : 0;
    if (count > 0)
      return c.json(
        {
          success: false,
          error: "Cannot delete a genre that is assigned to movies",
          usedBy: count,
        },
        409,
      );

    db.delete(genresTable).where(eq(genresTable.id, genre.id)).run();

    return c.json({
      success: true,
      message: "Genre deleted successfully",
      data: { id: genre.id, name: genre.name },
    });
  } catch (err: unknown) {
    return c.json(
      {
        success: false,
        error: "Failed to delete genre",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

export default router;
