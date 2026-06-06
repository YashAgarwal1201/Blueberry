// src/routes/collections.ts
import express, { Request, Response, Router } from "express";
import db from "../db";
import type {
  Collection,
  CollectionDetail,
  MovieCard,
  Language,
  Genre,
  CreateCollectionRequest,
  UpdateCollectionRequest,
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

function clean(str?: string | null): string | null {
  if (str === undefined || str === null) return null;
  const t = str.trim();
  return t === "" ? null : t;
}

/** Fetch MovieCard[] for a collection (bulk, no N+1) */
function getMovieCardsForCollection(collectionId: number): MovieCard[] {
  const rows = db
    .prepare(
      `SELECT m.id, m.title, m.poster_url, m.backdrop_url, m.release_year,
              m.runtime, m.rating_imdb, m.age_rating, m.status
       FROM movies m
       JOIN collection_movies cm ON m.id = cm.movie_id
       WHERE cm.collection_id = ?
       ORDER BY cm.display_order ASC, m.title ASC`,
    )
    .all(collectionId) as Omit<
    MovieCard,
    "in_watchlist" | "languages" | "genres"
  >[];

  if (rows.length === 0) return [];

  const ids = rows.map((m) => m.id);
  const ph = ids.map(() => "?").join(",");

  // Check watchlist membership in bulk
  const watchlistIds = new Set(
    (
      db
        .prepare(`SELECT movie_id FROM watchlist WHERE movie_id IN (${ph})`)
        .all(...ids) as { movie_id: number }[]
    ).map((r) => r.movie_id),
  );

  const allLangs = db
    .prepare(
      `SELECT ml.movie_id, l.id, l.name, l.code
       FROM languages l JOIN movie_languages ml ON l.id = ml.language_id
       WHERE ml.movie_id IN (${ph})`,
    )
    .all(...ids) as Array<
    Pick<Language, "id" | "name" | "code"> & { movie_id: number }
  >;

  const allGenres = db
    .prepare(
      `SELECT mg.movie_id, g.id, g.name, g.slug
       FROM genres g JOIN movie_genres mg ON g.id = mg.genre_id
       WHERE mg.movie_id IN (${ph})`,
    )
    .all(...ids) as Array<
    Pick<Genre, "id" | "name" | "slug"> & { movie_id: number }
  >;

  const langMap = new Map<number, Pick<Language, "id" | "name" | "code">[]>();
  const genreMap = new Map<number, Pick<Genre, "id" | "name" | "slug">[]>();

  allLangs.forEach(({ movie_id, ...l }) => {
    if (!langMap.has(movie_id)) langMap.set(movie_id, []);
    langMap.get(movie_id)!.push(l);
  });
  allGenres.forEach(({ movie_id, ...g }) => {
    if (!genreMap.has(movie_id)) genreMap.set(movie_id, []);
    genreMap.get(movie_id)!.push(g);
  });

  return rows.map((m) => ({
    ...m,
    status: m.status ?? "released",
    in_watchlist: watchlistIds.has(m.id),
    languages: langMap.get(m.id) ?? [],
    genres: genreMap.get(m.id) ?? [],
  })) as MovieCard[];
}

/** Build a Collection (list shape) with movie_count */
function getCollectionRow(id: number): Collection | undefined {
  const row = db.prepare(`SELECT * FROM collections WHERE id = ?`).get(id) as
    | Omit<Collection, "movie_count">
    | undefined;
  if (!row) return undefined;

  const { count } = db
    .prepare(
      `SELECT COUNT(*) as count FROM collection_movies WHERE collection_id = ?`,
    )
    .get(id) as { count: number };

  return { ...row, movie_count: count };
}

/** Build a CollectionDetail (single shape) with movies */
function getCollectionDetail(id: number): CollectionDetail | undefined {
  const collection = getCollectionRow(id);
  if (!collection) return undefined;
  return { ...collection, movies: getMovieCardsForCollection(id) };
}

// ── GET /collections ──────────────────────────────────────────────────────────

router.get("/", (req: Request, res: Response) => {
  try {
    const rows = db
      .prepare(`SELECT * FROM collections ORDER BY name ASC`)
      .all() as Omit<Collection, "movie_count">[];

    if (rows.length === 0) {
      return res.json({ success: true, count: 0, collections: [] });
    }

    const ids = rows.map((c) => c.id);
    const ph = ids.map(() => "?").join(",");

    const counts = db
      .prepare(
        `SELECT collection_id, COUNT(*) as count
         FROM collection_movies
         WHERE collection_id IN (${ph})
         GROUP BY collection_id`,
      )
      .all(...ids) as { collection_id: number; count: number }[];

    const countMap = new Map(counts.map((r) => [r.collection_id, r.count]));

    const collections: Collection[] = rows.map((c) => ({
      ...c,
      movie_count: countMap.get(c.id) ?? 0,
    }));

    res.json({ success: true, count: collections.length, collections });
  } catch (err: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch collections",
        message: err.message,
      });
  }
});

// ── GET /collections/:id ──────────────────────────────────────────────────────

router.get("/:id", (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, error: "Invalid collection ID" });

    const collection = getCollectionDetail(id);
    if (!collection)
      return res
        .status(404)
        .json({ success: false, error: "Collection not found" });

    res.json({ success: true, collection });
  } catch (err: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to fetch collection",
        message: err.message,
      });
  }
});

// ── POST /collections ─────────────────────────────────────────────────────────

router.post("/", (req: Request, res: Response) => {
  try {
    const body = req.body as CreateCollectionRequest;

    if (!body.name?.trim())
      return res
        .status(400)
        .json({ success: false, error: "Name is required" });

    const slug = body.slug?.trim() || slugify(body.name);

    const conflict = db
      .prepare(`SELECT id FROM collections WHERE slug = ?`)
      .get(slug) as { id: number } | undefined;
    if (conflict)
      return res
        .status(409)
        .json({
          success: false,
          error: "A collection with this name already exists",
        });

    const info = db
      .prepare(
        `INSERT INTO collections (name, slug, description, poster_url)
         VALUES (?, ?, ?, ?)`,
      )
      .run(
        body.name.trim(),
        slug,
        clean(body.description),
        clean(body.poster_url),
      );

    const collectionId = info.lastInsertRowid as number;
    const collection = getCollectionDetail(collectionId)!;

    res
      .status(201)
      .json({
        success: true,
        message: "Collection created successfully",
        collection,
      });
  } catch (err: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to create collection",
        message: err.message,
      });
  }
});

// ── PUT /collections/:id ──────────────────────────────────────────────────────

router.put("/:id", (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, error: "Invalid collection ID" });

    const existing = db
      .prepare(`SELECT * FROM collections WHERE id = ?`)
      .get(id) as Omit<Collection, "movie_count"> | undefined;
    if (!existing)
      return res
        .status(404)
        .json({ success: false, error: "Collection not found" });

    const body = req.body as UpdateCollectionRequest;
    const newName = body.name?.trim() ?? existing.name;
    const newSlug =
      body.slug?.trim() ?? (body.name ? slugify(body.name) : existing.slug);

    if (newSlug !== existing.slug) {
      const conflict = db
        .prepare(`SELECT id FROM collections WHERE slug = ? AND id != ?`)
        .get(newSlug, id) as { id: number } | undefined;
      if (conflict)
        return res
          .status(409)
          .json({
            success: false,
            error: "A collection with this name already exists",
          });
    }

    db.prepare(
      `UPDATE collections SET name = ?, slug = ?, description = ?, poster_url = ?
       WHERE id = ?`,
    ).run(
      newName,
      newSlug,
      clean(body.description ?? existing.description ?? null),
      clean(body.poster_url ?? existing.poster_url ?? null),
      id,
    );

    const collection = getCollectionDetail(id)!;
    res.json({
      success: true,
      message: "Collection updated successfully",
      collection,
    });
  } catch (err: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to update collection",
        message: err.message,
      });
  }
});

// ── DELETE /collections/:id ───────────────────────────────────────────────────

router.delete("/:id", (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, error: "Invalid collection ID" });

    const collection = db
      .prepare(`SELECT id, name FROM collections WHERE id = ?`)
      .get(id) as Pick<Collection, "id" | "name"> | undefined;
    if (!collection)
      return res
        .status(404)
        .json({ success: false, error: "Collection not found" });

    db.prepare(`DELETE FROM collections WHERE id = ?`).run(id);
    res.json({
      success: true,
      message: "Collection deleted successfully",
      deletedCollection: collection,
    });
  } catch (err: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to delete collection",
        message: err.message,
      });
  }
});

// ── POST /collections/:id/movies ──────────────────────────────────────────────

router.post("/:id/movies", (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, error: "Invalid collection ID" });

    const { movie_id } = req.body as { movie_id?: number };
    if (!movie_id)
      return res
        .status(400)
        .json({ success: false, error: "movie_id is required" });

    const collection = db
      .prepare(`SELECT id FROM collections WHERE id = ?`)
      .get(id) as { id: number } | undefined;
    if (!collection)
      return res
        .status(404)
        .json({ success: false, error: "Collection not found" });

    const movie = db
      .prepare(`SELECT id FROM movies WHERE id = ?`)
      .get(movie_id) as { id: number } | undefined;
    if (!movie)
      return res.status(404).json({ success: false, error: "Movie not found" });

    const { count } = db
      .prepare(
        `SELECT COUNT(*) as count FROM collection_movies WHERE collection_id = ?`,
      )
      .get(id) as { count: number };

    db.prepare(
      `INSERT OR IGNORE INTO collection_movies (collection_id, movie_id, display_order)
       VALUES (?, ?, ?)`,
    ).run(id, movie_id, count);

    res.json({ success: true, message: "Movie added to collection" });
  } catch (err: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to add movie to collection",
        message: err.message,
      });
  }
});

// ── DELETE /collections/:id/movies/:movieId ───────────────────────────────────

router.delete("/:id/movies/:movieId", (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    const movieId = parseInt(req.params.movieId as string);

    if (isNaN(id) || isNaN(movieId))
      return res.status(400).json({ success: false, error: "Invalid ID" });

    const result = db
      .prepare(
        `DELETE FROM collection_movies WHERE collection_id = ? AND movie_id = ?`,
      )
      .run(id, movieId);

    if (result.changes === 0)
      return res
        .status(404)
        .json({ success: false, error: "Movie not found in this collection" });

    res.json({ success: true, message: "Movie removed from collection" });
  } catch (err: any) {
    res
      .status(500)
      .json({
        success: false,
        error: "Failed to remove movie from collection",
        message: err.message,
      });
  }
});

export default router;
