import { Hono } from "hono";
import db, {
  collections as collectionsTable,
  collectionItems as collectionItemsTable,
  movies as moviesTable,
  tvShows as tvShowsTable,
  watchlist as watchlistTable,
  languages as languagesTable,
  movieLanguages as movieLanguagesTable,
  genres as genresTable,
  movieGenres as movieGenresTable,
} from "../db";
import { eq, and, ne, desc, asc, inArray, sql, isNull } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middleware/authMiddleware";
import { resolveImage } from "../utils/imageUtils";
import { clean } from "../utils/stringUtils";
import type {
  Collection,
  CollectionDetail,
  MediaCard,
  MovieCard,
  TVShowCard,
  Movie,
  TVShow,
  Language,
  Genre,
  CreateCollectionRequest,
  UpdateCollectionRequest,
} from "shared-types";
import { getErrorMessage } from "../utils/errors";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// ── Helpers ──────────────────────────────────────────────────────────────────

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Fetch MediaCard[] for a collection (bulk, mixed media) */
function getMediaCardsForCollection(collectionId: number): MediaCard[] {
  // Get all items in the collection
  const items = db
    .select({
      movie_id: collectionItemsTable.movie_id,
      show_id: collectionItemsTable.show_id,
      display_order: collectionItemsTable.display_order,
    })
    .from(collectionItemsTable)
    .where(eq(collectionItemsTable.collection_id, collectionId))
    .orderBy(asc(collectionItemsTable.display_order))
    .all();

  if (items.length === 0) return [];

  const movieIds = items.map((i) => i.movie_id).filter(Boolean) as number[];
  const showIds = items.map((i) => i.show_id).filter(Boolean) as number[];

  const movieMap = new Map<number, MovieCard>();
  const showMap = new Map<number, TVShowCard>();

  // Fetch Movies
  if (movieIds.length > 0) {
    const movies = db
      .select({
        id: moviesTable.id,
        uuid: moviesTable.uuid,
        title: moviesTable.title,
        poster_url: moviesTable.poster_url,
        tmdb_poster_path: moviesTable.tmdb_poster_path,
        local_poster_url: moviesTable.local_poster_url,
        backdrop_url: moviesTable.backdrop_url,
        tmdb_backdrop_path: moviesTable.tmdb_backdrop_path,
        local_backdrop_url: moviesTable.local_backdrop_url,
        release_year: moviesTable.release_year,
        runtime: moviesTable.runtime,
        rating_imdb: moviesTable.rating_imdb,
        age_rating: moviesTable.age_rating,
        status: moviesTable.status,
      })
      .from(moviesTable)
      .where(inArray(moviesTable.id, movieIds))
      .all() as unknown as Movie[];

    // Watchlist checks
    const watchlistRows = db
      .select({ movie_id: watchlistTable.movie_id })
      .from(watchlistTable)
      .where(inArray(watchlistTable.movie_id, movieIds))
      .all();
    const watchlistIds = new Set(
      watchlistRows.map((r) => r.movie_id).filter(Boolean) as number[]
    );

    const allLangs = db
      .select({
        movie_id: movieLanguagesTable.movie_id,
        id: languagesTable.id,
        name: languagesTable.name,
        code: languagesTable.code,
      })
      .from(languagesTable)
      .innerJoin(movieLanguagesTable, eq(languagesTable.id, movieLanguagesTable.language_id))
      .where(inArray(movieLanguagesTable.movie_id, movieIds))
      .all() as unknown as Array<Language & { movie_id: number }>;

    const allGenres = db
      .select({
        movie_id: movieGenresTable.movie_id,
        id: genresTable.id,
        name: genresTable.name,
        slug: genresTable.slug,
      })
      .from(genresTable)
      .innerJoin(movieGenresTable, eq(genresTable.id, movieGenresTable.genre_id))
      .where(inArray(movieGenresTable.movie_id, movieIds))
      .all() as unknown as Array<Genre & { movie_id: number }>;

    const langMap = new Map<number, Language[]>();
    allLangs.forEach(({ movie_id, ...l }) => {
      if (!langMap.has(movie_id)) langMap.set(movie_id, []);
      langMap.get(movie_id)!.push(l as Language);
    });

    const genreMap = new Map<number, Genre[]>();
    allGenres.forEach(({ movie_id, ...g }) => {
      if (!genreMap.has(movie_id)) genreMap.set(movie_id, []);
      genreMap.get(movie_id)!.push(g as Genre);
    });

    movies.forEach((m) => {
      movieMap.set(m.id, {
        id: m.id,
        uuid: m.uuid,
        title: m.title,
        poster_url: resolveImage(m.tmdb_poster_path, m.local_poster_url) || m.poster_url,
        backdrop_url: resolveImage(m.tmdb_backdrop_path, m.local_backdrop_url, "w780") || m.backdrop_url,
        release_year: m.release_year,
        runtime: m.runtime,
        rating_imdb: m.rating_imdb,
        age_rating: m.age_rating,
        type: "movie",
        status: m.status ?? "released",
        in_watchlist: watchlistIds.has(m.id),
        languages: langMap.get(m.id) ?? [],
        genres: genreMap.get(m.id) ?? [],
      });
    });
  }

  // Fetch Shows
  if (showIds.length > 0) {
    const shows = db
      .select({
        id: tvShowsTable.id,
        uuid: tvShowsTable.uuid,
        title: tvShowsTable.title,
        poster_url: tvShowsTable.poster_url,
        tmdb_poster_path: tvShowsTable.tmdb_poster_path,
        backdrop_url: tvShowsTable.backdrop_url,
        tmdb_backdrop_path: tvShowsTable.tmdb_backdrop_path,
        first_air_date: tvShowsTable.first_air_date,
        network: tvShowsTable.network,
        status: tvShowsTable.status,
      })
      .from(tvShowsTable)
      .where(inArray(tvShowsTable.id, showIds))
      .all() as unknown as TVShow[];

    // Watchlist checks
    const watchlistRows = db
      .select({ show_id: watchlistTable.show_id })
      .from(watchlistTable)
      .where(inArray(watchlistTable.show_id, showIds))
      .all();
    const watchlistIds = new Set(
      watchlistRows.map((r) => r.show_id).filter(Boolean) as number[]
    );

    shows.forEach((s) => {
      showMap.set(s.id, {
        id: s.id,
        uuid: s.uuid,
        title: s.title,
        poster_url: resolveImage(s.tmdb_poster_path, null) || s.poster_url,
        backdrop_url: resolveImage(s.tmdb_backdrop_path, null, "w780") || s.backdrop_url,
        type: "tv",
        release_year: s.first_air_date ? parseInt(s.first_air_date.substring(0, 4)) : undefined,
        status: s.status ?? "returning_series",
        in_watchlist: watchlistIds.has(s.id),
        genres: [],
      });
    });
  }

  // Map back to ordered items
  return items
    .map((item) => {
      if (item.movie_id) return movieMap.get(item.movie_id);
      if (item.show_id) return showMap.get(item.show_id);
    })
    .filter(Boolean) as MediaCard[];
}

/** Build a Collection (list shape) with item_count */
function getCollectionRow(id: number): Collection | undefined {
  const row = db
    .select()
    .from(collectionsTable)
    .where(eq(collectionsTable.id, id))
    .get() as Omit<Collection, "item_count"> | undefined;

  if (!row) return undefined;

  const countRow = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(collectionItemsTable)
    .where(eq(collectionItemsTable.collection_id, id))
    .get();
  const count = Number(countRow?.count ?? 0);

  return { ...row, item_count: count };
}

/** Build a CollectionDetail (single shape) with items */
function getCollectionDetail(id: number): CollectionDetail | undefined {
  const collection = getCollectionRow(id);
  if (!collection) return undefined;
  return { ...collection, items: getMediaCardsForCollection(id) };
}

// ── GET /collections ──────────────────────────────────────────────────────────

router.get("/", optionalAuth, (c) => {
  try {
    const user = c.get("user");
    const isCommunity = c.req.query("community") === "true";

    let rows: Omit<Collection, "item_count">[];

    if (isCommunity || !user) {
      rows = db
        .select()
        .from(collectionsTable)
        .where(eq(collectionsTable.privacy, "public"))
        .orderBy(desc(collectionsTable.created_at))
        .limit(20)
        .all() as Omit<Collection, "item_count">[];
    } else {
      rows = db
        .select()
        .from(collectionsTable)
        .where(eq(collectionsTable.user_id, user.id))
        .orderBy(desc(collectionsTable.created_at))
        .all() as Omit<Collection, "item_count">[];
    }

    if (rows.length === 0) {
      return c.json({ success: true, data: [] });
    }

    const ids = rows.map((col) => col.id);

    const counts = db
      .select({
        collection_id: collectionItemsTable.collection_id,
        count: sql<number>`COUNT(*)`,
      })
      .from(collectionItemsTable)
      .where(inArray(collectionItemsTable.collection_id, ids))
      .groupBy(collectionItemsTable.collection_id)
      .all();

    const countMap = new Map(counts.map((r) => [r.collection_id, Number(r.count)]));

    const collections: Collection[] = rows.map((col) => ({
      ...col,
      item_count: countMap.get(col.id) ?? 0,
    }));

    return c.json({ success: true, data: collections });
  } catch (err: unknown) {
    return c.json({ success: false, error: "Failed to fetch collections", message: getErrorMessage(err) }, 500);
  }
});

// ── GET /collections/:id ──────────────────────────────────────────────────────

router.get("/:id", optionalAuth, (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return c.json({ success: false, error: "Invalid collection ID" }, 400);

    const collection = getCollectionDetail(id);
    if (!collection) return c.json({ success: false, error: "Collection not found" }, 404);

    const user = c.get("user");

    if (collection.privacy === "private" && collection.user_id !== user?.id) {
      return c.json({ success: false, error: "This collection is private" }, 403);
    }

    return c.json({ success: true, data: collection });
  } catch (err: unknown) {
    return c.json({ success: false, error: "Failed to fetch collection", message: getErrorMessage(err) }, 500);
  }
});

// ── POST /collections ─────────────────────────────────────────────────────────

router.post("/", requireAuth, async (c) => {
  try {
    const user = c.get("user")!;
    const body = await c.req.json<CreateCollectionRequest>().catch(() => ({} as CreateCollectionRequest));

    if (!body.name?.trim()) return c.json({ success: false, error: "Name is required" }, 400);

    let slug = body.slug?.trim() || slugify(body.name);
    if (!slug) slug = `collection-${Date.now()}`;

    const conflict = db
      .select({ id: collectionsTable.id })
      .from(collectionsTable)
      .where(and(eq(collectionsTable.user_id, user.id), eq(collectionsTable.slug, slug)))
      .get();

    if (conflict) {
      slug = `${slug}-${Date.now()}`;
    }

    const privacy = body.privacy || "private";

    const info = db
      .insert(collectionsTable)
      .values({
        user_id: user.id,
        name: body.name.trim(),
        slug,
        description: clean(body.description),
        poster_url: clean(body.poster_url),
        privacy,
      })
      .run();

    const collectionId = Number(info.lastInsertRowid);
    const collection = getCollectionDetail(collectionId)!;

    return c.json({ success: true, message: "Collection created successfully", data: collection }, 201);
  } catch (err: unknown) {
    return c.json({ success: false, error: "Failed to create collection", message: getErrorMessage(err) }, 500);
  }
});

// ── PUT /collections/:id ──────────────────────────────────────────────────────

router.put("/:id", requireAuth, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return c.json({ success: false, error: "Invalid collection ID" }, 400);

    const user = c.get("user")!;
    const existing = db
      .select()
      .from(collectionsTable)
      .where(eq(collectionsTable.id, id))
      .get() as Omit<Collection, "item_count"> | undefined;

    if (!existing) return c.json({ success: false, error: "Collection not found" }, 404);

    const isPrivileged = user.role === "admin" || user.role === "moderator";
    if (existing.user_id !== user.id && !isPrivileged) return c.json({ success: false, error: "You do not own this collection" }, 403);

    const body = await c.req.json<UpdateCollectionRequest>().catch(() => ({} as UpdateCollectionRequest));
    const newName = body.name?.trim() ?? existing.name;
    const newSlug = body.slug?.trim() ?? (body.name ? slugify(body.name) : existing.slug);
    const newPrivacy = body.privacy ?? existing.privacy;

    if (newSlug !== existing.slug) {
      const conflict = db
        .select({ id: collectionsTable.id })
        .from(collectionsTable)
        .where(
          and(
            eq(collectionsTable.user_id, user.id),
            eq(collectionsTable.slug, newSlug),
            ne(collectionsTable.id, id)
          )
        )
        .get();
      if (conflict) return c.json({ success: false, error: "You already have a collection with this slug/name" }, 409);
    }

    db.update(collectionsTable)
      .set({
        name: newName,
        slug: newSlug,
        description: clean(body.description ?? existing.description ?? null),
        poster_url: clean(body.poster_url ?? existing.poster_url ?? null),
        privacy: newPrivacy,
      })
      .where(eq(collectionsTable.id, id))
      .run();

    const collection = getCollectionDetail(id)!;
    return c.json({ success: true, message: "Collection updated successfully", data: collection });
  } catch (err: unknown) {
    return c.json({ success: false, error: "Failed to update collection", message: getErrorMessage(err) }, 500);
  }
});

// ── DELETE /collections/:id ───────────────────────────────────────────────────

router.delete("/:id", requireAuth, (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return c.json({ success: false, error: "Invalid collection ID" }, 400);

    const user = c.get("user")!;
    const collection = db
      .select({ id: collectionsTable.id, name: collectionsTable.name, user_id: collectionsTable.user_id })
      .from(collectionsTable)
      .where(eq(collectionsTable.id, id))
      .get();

    if (!collection) return c.json({ success: false, error: "Collection not found" }, 404);
    const isPrivileged = user.role === "admin" || user.role === "moderator";
    if (collection.user_id !== user.id && !isPrivileged) return c.json({ success: false, error: "You do not own this collection" }, 403);

    db.delete(collectionsTable).where(eq(collectionsTable.id, id)).run();
    return c.json({ success: true, message: "Collection deleted successfully", data: { id: collection.id } });
  } catch (err: unknown) {
    return c.json({ success: false, error: "Failed to delete collection", message: getErrorMessage(err) }, 500);
  }
});

// ── POST /collections/:id/items ──────────────────────────────────────────────

router.post("/:id/items", requireAuth, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return c.json({ success: false, error: "Invalid collection ID" }, 400);

    const user = c.get("user")!;
    const body = await c.req.json<{ movie_id?: number; show_id?: number }>().catch(() => ({} as { movie_id?: number; show_id?: number }));
    const { movie_id, show_id } = body;

    if (!movie_id && !show_id) return c.json({ success: false, error: "movie_id or show_id is required" }, 400);

    const collection = db
      .select({ id: collectionsTable.id, user_id: collectionsTable.user_id })
      .from(collectionsTable)
      .where(eq(collectionsTable.id, id))
      .get();

    if (!collection) return c.json({ success: false, error: "Collection not found" }, 404);
    if (collection.user_id !== user.id) return c.json({ success: false, error: "You do not own this collection" }, 403);

    if (movie_id) {
      const movie = db
        .select({ id: moviesTable.id })
        .from(moviesTable)
        .where(eq(moviesTable.id, movie_id))
        .get();
      if (!movie) return c.json({ success: false, error: "Movie not found" }, 404);
    }
    if (show_id) {
      const show = db
        .select({ id: tvShowsTable.id })
        .from(tvShowsTable)
        .where(eq(tvShowsTable.id, show_id))
        .get();
      if (!show) return c.json({ success: false, error: "Show not found" }, 404);
    }

    const countRow = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(collectionItemsTable)
      .where(eq(collectionItemsTable.collection_id, id))
      .get();
    const count = Number(countRow?.count ?? 0);

    db.insert(collectionItemsTable)
      .values({
        collection_id: id,
        movie_id: movie_id || null,
        show_id: show_id || null,
        display_order: count,
      })
      .onConflictDoNothing()
      .run();

    const collectionDetail = getCollectionDetail(id);
    return c.json({ success: true, message: "Item added to collection", data: collectionDetail });
  } catch (err: unknown) {
    return c.json({ success: false, error: "Failed to add item to collection", message: getErrorMessage(err) }, 500);
  }
});

// ── DELETE /collections/:id/items ─────────────────────────────────────────────

router.delete("/:id/items", requireAuth, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return c.json({ success: false, error: "Invalid collection ID" }, 400);

    const user = c.get("user")!;

    const body = await c.req.json<{ movie_id?: number; show_id?: number }>().catch(() => ({} as { movie_id?: number; show_id?: number }));
    const mId = body.movie_id || (c.req.query("movie_id") ? parseInt(c.req.query("movie_id")!) : NaN);
    const sId = body.show_id || (c.req.query("show_id") ? parseInt(c.req.query("show_id")!) : NaN);

    if (isNaN(mId) && isNaN(sId)) return c.json({ success: false, error: "movie_id or show_id is required" }, 400);

    const collection = db
      .select({ id: collectionsTable.id, user_id: collectionsTable.user_id })
      .from(collectionsTable)
      .where(eq(collectionsTable.id, id))
      .get();

    if (!collection) return c.json({ success: false, error: "Collection not found" }, 404);
    if (collection.user_id !== user.id) return c.json({ success: false, error: "You do not own this collection" }, 403);

    let result;
    if (!isNaN(mId)) {
      result = db
        .delete(collectionItemsTable)
        .where(
          and(
            eq(collectionItemsTable.collection_id, id),
            eq(collectionItemsTable.movie_id, mId)
          )
        )
        .run();
    } else if (!isNaN(sId)) {
      result = db
        .delete(collectionItemsTable)
        .where(
          and(
            eq(collectionItemsTable.collection_id, id),
            eq(collectionItemsTable.show_id, sId)
          )
        )
        .run();
    }

    if (!result || result.changes === 0) return c.json({ success: false, error: "Item not found in this collection" }, 404);

    const collectionDetail = getCollectionDetail(id);
    return c.json({ success: true, message: "Item removed from collection", data: collectionDetail });
  } catch (err: unknown) {
    return c.json({ success: false, error: "Failed to remove item from collection", message: getErrorMessage(err) }, 500);
  }
});

// ── PUT /collections/:id/reorder ──────────────────────────────────────────────

router.put("/:id/reorder", requireAuth, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return c.json({ success: false, error: "Invalid collection ID" }, 400);

    const user = c.get("user")!;
    const body = await c.req.json<{ items?: { movie_id?: number; show_id?: number; display_order: number }[] }>().catch(() => ({} as { items?: { movie_id?: number; show_id?: number; display_order: number }[] }));
    const { items } = body;

    if (!Array.isArray(items)) return c.json({ success: false, error: "items array is required" }, 400);

    const collection = db
      .select({ id: collectionsTable.id, user_id: collectionsTable.user_id })
      .from(collectionsTable)
      .where(eq(collectionsTable.id, id))
      .get();

    if (!collection) return c.json({ success: false, error: "Collection not found" }, 404);
    if (collection.user_id !== user.id) return c.json({ success: false, error: "You do not own this collection" }, 403);

    db.transaction(() => {
      for (const item of items) {
        const itemConditions = [eq(collectionItemsTable.collection_id, id)];
        if (item.movie_id) {
          itemConditions.push(eq(collectionItemsTable.movie_id, item.movie_id));
        } else {
          itemConditions.push(isNull(collectionItemsTable.movie_id));
        }
        if (item.show_id) {
          itemConditions.push(eq(collectionItemsTable.show_id, item.show_id));
        } else {
          itemConditions.push(isNull(collectionItemsTable.show_id));
        }

        db.update(collectionItemsTable)
          .set({ display_order: item.display_order })
          .where(and(...itemConditions))
          .run();
      }
    })();

    const collectionDetail = getCollectionDetail(id);
    return c.json({ success: true, message: "Collection reordered", data: collectionDetail });
  } catch (err: unknown) {
    return c.json({ success: false, error: "Failed to reorder collection", message: getErrorMessage(err) }, 500);
  }
});

export default router;
