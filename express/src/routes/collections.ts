import express, { Request, Response, Router } from "express";
import db from "../db";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware";
import { resolveImage } from "../utils/imageUtils";
import type {
  Collection,
  CollectionDetail,
  MediaCard,
  Language,
  Genre,
  CreateCollectionRequest,
  UpdateCollectionRequest,
} from "shared-types";

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

/** Fetch MediaCard[] for a collection (bulk, mixed media) */
function getMediaCardsForCollection(collectionId: number): MediaCard[] {
  // Get all items in the collection
  const items = db.prepare(`
    SELECT ci.movie_id, ci.show_id, ci.display_order
    FROM collection_items ci
    WHERE ci.collection_id = ?
    ORDER BY ci.display_order ASC
  `).all(collectionId) as { movie_id: number | null, show_id: number | null, display_order: number }[];

  if (items.length === 0) return [];

  const movieIds = items.map(i => i.movie_id).filter(Boolean) as number[];
  const showIds = items.map(i => i.show_id).filter(Boolean) as number[];

  const movieMap = new Map<number, any>();
  const showMap = new Map<number, any>();

  // Fetch Movies
  if (movieIds.length > 0) {
    const ph = movieIds.map(() => "?").join(",");
    const movies = db.prepare(`SELECT id, uuid, title, poster_url, tmdb_poster_path, local_poster_url, backdrop_url, tmdb_backdrop_path, local_backdrop_url, release_year, runtime, rating_imdb, age_rating, status FROM movies WHERE id IN (${ph})`).all(...movieIds) as any[];
    
    // Watchlist checks
    const watchlistIds = new Set(
      (db.prepare(`SELECT movie_id FROM watchlist WHERE movie_id IN (${ph})`).all(...movieIds) as { movie_id: number }[]).map((r) => r.movie_id)
    );

    const allLangs = db.prepare(`SELECT ml.movie_id, l.id, l.name, l.code FROM languages l JOIN movie_languages ml ON l.id = ml.language_id WHERE ml.movie_id IN (${ph})`).all(...movieIds) as any[];
    const allGenres = db.prepare(`SELECT mg.movie_id, g.id, g.name, g.slug FROM genres g JOIN movie_genres mg ON g.id = mg.genre_id WHERE mg.movie_id IN (${ph})`).all(...movieIds) as any[];

    const langMap = new Map<number, any[]>();
    allLangs.forEach(({ movie_id, ...l }) => {
      if (!langMap.has(movie_id)) langMap.set(movie_id, []);
      langMap.get(movie_id)!.push(l);
    });

    const genreMap = new Map<number, any[]>();
    allGenres.forEach(({ movie_id, ...g }) => {
      if (!genreMap.has(movie_id)) genreMap.set(movie_id, []);
      genreMap.get(movie_id)!.push(g);
    });

    movies.forEach(m => {
      movieMap.set(m.id, {
        ...m,
        type: 'movie',
        poster_url: resolveImage(m.tmdb_poster_path, m.local_poster_url) || m.poster_url,
        backdrop_url: resolveImage(m.tmdb_backdrop_path, m.local_backdrop_url, 'w780') || m.backdrop_url,
        status: m.status ?? "released",
        in_watchlist: watchlistIds.has(m.id),
        languages: langMap.get(m.id) ?? [],
        genres: genreMap.get(m.id) ?? [],
      });
    });
  }

  // Fetch Shows
  if (showIds.length > 0) {
    const ph = showIds.map(() => "?").join(",");
    const shows = db.prepare(`SELECT id, uuid, title, poster_url, tmdb_poster_path, backdrop_url, tmdb_backdrop_path, first_air_date, network, status FROM tv_shows WHERE id IN (${ph})`).all(...showIds) as any[];
    
    // Watchlist checks
    const watchlistIds = new Set(
      (db.prepare(`SELECT show_id FROM watchlist WHERE show_id IN (${ph})`).all(...showIds) as { show_id: number }[]).map((r) => r.show_id)
    );

    shows.forEach(s => {
      showMap.set(s.id, {
        ...s,
        poster_url: resolveImage(s.tmdb_poster_path, null) || s.poster_url,
        backdrop_url: resolveImage(s.tmdb_backdrop_path, null, 'w780') || s.backdrop_url,
        type: 'tv',
        release_year: s.first_air_date ? parseInt(s.first_air_date.substring(0,4)) : undefined,
        in_watchlist: watchlistIds.has(s.id),
        genres: [], // Add genres logic for TV shows if implemented
      });
    });
  }

  // Map back to ordered items
  return items.map(item => {
    if (item.movie_id) return movieMap.get(item.movie_id);
    if (item.show_id) return showMap.get(item.show_id);
  }).filter(Boolean) as MediaCard[];
}

/** Build a Collection (list shape) with item_count */
function getCollectionRow(id: number): Collection | undefined {
  const row = db.prepare(`SELECT * FROM collections WHERE id = ?`).get(id) as Omit<Collection, "item_count"> | undefined;
  if (!row) return undefined;

  const { count } = db.prepare(`SELECT COUNT(*) as count FROM collection_items WHERE collection_id = ?`).get(id) as { count: number };

  return { ...row, item_count: count };
}

/** Build a CollectionDetail (single shape) with items */
function getCollectionDetail(id: number): CollectionDetail | undefined {
  const collection = getCollectionRow(id);
  if (!collection) return undefined;
  return { ...collection, items: getMediaCardsForCollection(id) };
}

// ── GET /collections ──────────────────────────────────────────────────────────

router.get("/", optionalAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    let query = `SELECT * FROM collections WHERE privacy = 'public' ORDER BY created_at DESC`;
    let params: any[] = [];

    if (user) {
      query = `SELECT * FROM collections WHERE user_id = ? ORDER BY created_at DESC`;
      params = [user.id];
    } else {
      query = `SELECT * FROM collections WHERE privacy = 'public' ORDER BY created_at DESC LIMIT 20`;
    }

    if (req.query.community === 'true') {
      query = `SELECT * FROM collections WHERE privacy = 'public' ORDER BY created_at DESC LIMIT 20`;
      params = [];
    }

    const rows = db.prepare(query).all(...params) as Omit<Collection, "item_count">[];

    if (rows.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const ids = rows.map((c) => c.id);
    const ph = ids.map(() => "?").join(",");

    const counts = db.prepare(`
      SELECT collection_id, COUNT(*) as count
      FROM collection_items
      WHERE collection_id IN (${ph})
      GROUP BY collection_id
    `).all(...ids) as { collection_id: number; count: number }[];

    const countMap = new Map(counts.map((r) => [r.collection_id, r.count]));

    const collections: Collection[] = rows.map((c) => ({
      ...c,
      item_count: countMap.get(c.id) ?? 0,
    }));

    res.json({ success: true, data: collections });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to fetch collections", message: err.message });
  }
});

// ── GET /collections/:id ──────────────────────────────────────────────────────

router.get("/:id", optionalAuth, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid collection ID" });

    const collection = getCollectionDetail(id);
    if (!collection) return res.status(404).json({ success: false, error: "Collection not found" });

    const user = (req as any).user;
    
    if (collection.privacy === 'private' && collection.user_id !== user?.id) {
       return res.status(403).json({ success: false, error: "This collection is private" });
    }

    res.json({ success: true, data: collection });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to fetch collection", message: err.message });
  }
});

// ── POST /collections ─────────────────────────────────────────────────────────

router.post("/", requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const body = req.body as CreateCollectionRequest;

    if (!body.name?.trim()) return res.status(400).json({ success: false, error: "Name is required" });

    let slug = body.slug?.trim() || slugify(body.name);
    if (!slug) slug = `collection-${Date.now()}`;

    const conflict = db.prepare(`SELECT id FROM collections WHERE user_id = ? AND slug = ?`).get(user.id, slug) as { id: number } | undefined;
    if (conflict) {
      slug = `${slug}-${Date.now()}`; 
    }

    const privacy = body.privacy || 'private';

    const info = db.prepare(`
      INSERT INTO collections (user_id, name, slug, description, poster_url, privacy)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(user.id, body.name.trim(), slug, clean(body.description), clean(body.poster_url), privacy);

    const collectionId = info.lastInsertRowid as number;
    const collection = getCollectionDetail(collectionId)!;

    res.status(201).json({ success: true, message: "Collection created successfully", data: collection });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to create collection", message: err.message });
  }
});

// ── PUT /collections/:id ──────────────────────────────────────────────────────

router.put("/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid collection ID" });

    const user = (req as any).user;
    const existing = db.prepare(`SELECT * FROM collections WHERE id = ?`).get(id) as Omit<Collection, "item_count"> | undefined;
    if (!existing) return res.status(404).json({ success: false, error: "Collection not found" });

    if (existing.user_id !== user.id) return res.status(403).json({ success: false, error: "You do not own this collection" });

    const body = req.body as UpdateCollectionRequest;
    const newName = body.name?.trim() ?? existing.name;
    const newSlug = body.slug?.trim() ?? (body.name ? slugify(body.name) : existing.slug);
    const newPrivacy = body.privacy ?? existing.privacy;

    if (newSlug !== existing.slug) {
      const conflict = db.prepare(`SELECT id FROM collections WHERE user_id = ? AND slug = ? AND id != ?`).get(user.id, newSlug, id) as { id: number } | undefined;
      if (conflict) return res.status(409).json({ success: false, error: "You already have a collection with this slug/name" });
    }

    db.prepare(`
      UPDATE collections SET name = ?, slug = ?, description = ?, poster_url = ?, privacy = ?
      WHERE id = ?
    `).run(
      newName,
      newSlug,
      clean(body.description ?? existing.description ?? null),
      clean(body.poster_url ?? existing.poster_url ?? null),
      newPrivacy,
      id
    );

    const collection = getCollectionDetail(id)!;
    res.json({ success: true, message: "Collection updated successfully", data: collection });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to update collection", message: err.message });
  }
});

// ── DELETE /collections/:id ───────────────────────────────────────────────────

router.delete("/:id", requireAuth, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid collection ID" });

    const user = (req as any).user;
    const collection = db.prepare(`SELECT id, name, user_id FROM collections WHERE id = ?`).get(id) as Pick<Collection, "id" | "name" | "user_id"> | undefined;
    
    if (!collection) return res.status(404).json({ success: false, error: "Collection not found" });
    if (collection.user_id !== user.id) return res.status(403).json({ success: false, error: "You do not own this collection" });

    db.prepare(`DELETE FROM collections WHERE id = ?`).run(id);
    res.json({ success: true, message: "Collection deleted successfully", data: { id: collection.id } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to delete collection", message: err.message });
  }
});

// ── POST /collections/:id/items ──────────────────────────────────────────────

router.post("/:id/items", requireAuth, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid collection ID" });

    const user = (req as any).user;
    const { movie_id, show_id } = req.body as { movie_id?: number, show_id?: number };
    
    if (!movie_id && !show_id) return res.status(400).json({ success: false, error: "movie_id or show_id is required" });

    const collection = db.prepare(`SELECT id, user_id FROM collections WHERE id = ?`).get(id) as { id: number, user_id: string } | undefined;
    if (!collection) return res.status(404).json({ success: false, error: "Collection not found" });
    if (collection.user_id !== user.id) return res.status(403).json({ success: false, error: "You do not own this collection" });

    if (movie_id) {
      const movie = db.prepare(`SELECT id FROM movies WHERE id = ?`).get(movie_id);
      if (!movie) return res.status(404).json({ success: false, error: "Movie not found" });
    }
    if (show_id) {
      const show = db.prepare(`SELECT id FROM tv_shows WHERE id = ?`).get(show_id);
      if (!show) return res.status(404).json({ success: false, error: "Show not found" });
    }

    const { count } = db.prepare(`SELECT COUNT(*) as count FROM collection_items WHERE collection_id = ?`).get(id) as { count: number };

    db.prepare(`
      INSERT OR IGNORE INTO collection_items (collection_id, movie_id, show_id, display_order)
      VALUES (?, ?, ?, ?)
    `).run(id, movie_id || null, show_id || null, count);

    const collectionDetail = getCollectionDetail(id);
    res.json({ success: true, message: "Item added to collection", data: collectionDetail });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to add item to collection", message: err.message });
  }
});

// ── DELETE /collections/:id/items ─────────────────────────────────────────────

router.delete("/:id/items", requireAuth, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid collection ID" });

    const user = (req as any).user;
    
    const mId = req.body.movie_id || parseInt(req.query.movie_id as string);
    const sId = req.body.show_id || parseInt(req.query.show_id as string);

    if (isNaN(mId) && isNaN(sId)) return res.status(400).json({ success: false, error: "movie_id or show_id is required" });

    const collection = db.prepare(`SELECT id, user_id FROM collections WHERE id = ?`).get(id) as { id: number, user_id: string } | undefined;
    if (!collection) return res.status(404).json({ success: false, error: "Collection not found" });
    if (collection.user_id !== user.id) return res.status(403).json({ success: false, error: "You do not own this collection" });

    let result;
    if (!isNaN(mId)) {
      result = db.prepare(`DELETE FROM collection_items WHERE collection_id = ? AND movie_id = ?`).run(id, mId);
    } else if (!isNaN(sId)) {
      result = db.prepare(`DELETE FROM collection_items WHERE collection_id = ? AND show_id = ?`).run(id, sId);
    }

    if (!result || result.changes === 0) return res.status(404).json({ success: false, error: "Item not found in this collection" });

    const collectionDetail = getCollectionDetail(id);
    res.json({ success: true, message: "Item removed from collection", data: collectionDetail });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to remove item from collection", message: err.message });
  }
});

// ── PUT /collections/:id/reorder ──────────────────────────────────────────────

router.put("/:id/reorder", requireAuth, (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid collection ID" });

    const user = (req as any).user;
    const { items } = req.body as { items: { movie_id?: number, show_id?: number, display_order: number }[] };

    if (!Array.isArray(items)) return res.status(400).json({ success: false, error: "items array is required" });

    const collection = db.prepare(`SELECT id, user_id FROM collections WHERE id = ?`).get(id) as { id: number, user_id: string } | undefined;
    if (!collection) return res.status(404).json({ success: false, error: "Collection not found" });
    if (collection.user_id !== user.id) return res.status(403).json({ success: false, error: "You do not own this collection" });
    
    db.transaction(() => {
      for (const item of items) {
         db.prepare(`
           UPDATE collection_items 
           SET display_order = ? 
           WHERE collection_id = ? 
             AND (movie_id = ? OR (movie_id IS NULL AND ? IS NULL))
             AND (show_id = ? OR (show_id IS NULL AND ? IS NULL))
         `).run(item.display_order, id, item.movie_id || null, item.movie_id || null, item.show_id || null, item.show_id || null);
      }
    })();

    const collectionDetail = getCollectionDetail(id);
    res.json({ success: true, message: "Collection reordered", data: collectionDetail });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to reorder collection", message: err.message });
  }
});

export default router;
