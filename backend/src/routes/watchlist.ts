// src/routes/watchlist.ts

import { Hono } from "hono";
import db, {
  watchlist as watchlistTable,
  movies as moviesTable,
  tvShows as tvShowsTable,
  tvSeasons as tvSeasonsTable,
  tvEpisodes as tvEpisodesTable,
  userWatchedEpisodes as userWatchedEpisodesTable,
  languages as languagesTable,
  movieLanguages as movieLanguagesTable,
  genres as genresTable,
  movieGenres as movieGenresTable,
} from "../db";
import { eq, and, desc, inArray, sql, asc, or } from "drizzle-orm";
import { resolveImage } from "../utils/imageUtils";
import { invalidateWatchlistCache } from "../utils/watchlistCache";
import type {
  WatchlistItem,
  WatchlistPopulatedItem,
  AddToWatchlistRequest,
  UpdateWatchlistRequest,
  Movie,
  TVShow,
  MovieCard,
  TVShowCard,
  Language,
  Genre,
  TVEpisode,
} from "shared-types";
import { getErrorMessage } from "../utils/errors";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

function formatWatchlistItem(row: any): WatchlistItem {
  return {
    ...row,
    liked: !!row.liked,
  } as WatchlistItem;
}

// ── Drizzle helper queries ────────────────────────────────────────────────────

function selectAllWatchlist(): WatchlistItem[] {
  const rows = db
    .select()
    .from(watchlistTable)
    .orderBy(desc(watchlistTable.added_at))
    .all();
  return rows.map(formatWatchlistItem);
}

function selectWatchlistById(id: number): WatchlistItem | undefined {
  const row = db
    .select()
    .from(watchlistTable)
    .where(eq(watchlistTable.id, id))
    .get();
  return row ? formatWatchlistItem(row) : undefined;
}

function selectWatchlistByMovieId(movieId: number): WatchlistItem | undefined {
  const row = db
    .select()
    .from(watchlistTable)
    .where(eq(watchlistTable.movie_id, movieId))
    .get();
  return row ? formatWatchlistItem(row) : undefined;
}

function selectWatchlistByShowId(showId: number): WatchlistItem | undefined {
  const row = db
    .select()
    .from(watchlistTable)
    .where(eq(watchlistTable.show_id, showId))
    .get();
  return row ? formatWatchlistItem(row) : undefined;
}

function selectWatchlistByStatus(status: string): WatchlistItem[] {
  const rows = db
    .select()
    .from(watchlistTable)
    .where(eq(watchlistTable.status, status))
    .orderBy(desc(watchlistTable.added_at))
    .all();
  return rows.map(formatWatchlistItem);
}

// ── Batch attach helper ───────────────────────────────────────────────────────

function attachMediaToWatchlistItems(
  items: WatchlistItem[],
): WatchlistPopulatedItem[] {
  if (items.length === 0) return [];

  const movieIds = items.map((i) => i.movie_id).filter(Boolean) as number[];
  const showIds = items.map((i) => i.show_id).filter(Boolean) as number[];

  const movieMap = new Map<number, MovieCard>();
  const showMap = new Map<number, TVShowCard>();

  // Fetch Movies
  if (movieIds.length > 0) {
    const movies = db
      .select()
      .from(moviesTable)
      .where(inArray(moviesTable.id, movieIds))
      .all() as unknown as Movie[];

    const allLanguages = db
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
      .where(inArray(movieLanguagesTable.movie_id, movieIds))
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
      .where(inArray(movieGenresTable.movie_id, movieIds))
      .all();

    const languageMap = new Map<number, Language[]>();
    allLanguages.forEach(({ movie_id, ...lang }) => {
      if (!languageMap.has(movie_id)) languageMap.set(movie_id, []);
      languageMap.get(movie_id)!.push(lang);
    });

    const genreMap = new Map<number, Genre[]>();
    allGenres.forEach(({ movie_id, ...genre }) => {
      if (!genreMap.has(movie_id)) genreMap.set(movie_id, []);
      genreMap.get(movie_id)!.push(genre as Genre);
    });

    movies.forEach((m) => {
      movieMap.set(m.id, {
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
        in_watchlist: true,
        languages: languageMap.get(m.id) ?? [],
        genres: genreMap.get(m.id) ?? [],
      });
    });
  }

  // Fetch Shows
  if (showIds.length > 0) {
    const shows = db
      .select()
      .from(tvShowsTable)
      .where(inArray(tvShowsTable.id, showIds))
      .all() as unknown as TVShow[];

    shows.forEach((s) => {
      showMap.set(s.id, {
        id: s.id,
        uuid: s.uuid,
        type: "tv",
        title: s.title,
        poster_url:
          resolveImage(s.tmdb_poster_path, null) || s.poster_url,
        backdrop_url:
          resolveImage(s.tmdb_backdrop_path, null, "w780") || s.backdrop_url,
        release_year: s.first_air_date
          ? parseInt(s.first_air_date.substring(0, 4))
          : undefined,
        status: s.status ?? "returning_series",
        in_watchlist: true,
        genres: [],
        description: s.description,
      });
    });
  }

  return items.map((item) => {
    const formattedItem = { ...item, liked: !!item.liked };
    if (formattedItem.movie_id) {
      return {
        ...formattedItem,
        movie: movieMap.get(formattedItem.movie_id)!,
      } as WatchlistPopulatedItem;
    }
    if (formattedItem.show_id) {
      return {
        ...formattedItem,
        show: showMap.get(formattedItem.show_id)!,
      } as WatchlistPopulatedItem;
    }
    return formattedItem as WatchlistPopulatedItem;
  });
}

// ── GET /watchlist/movie/:movieId ─────────────────────────────────────────────

router.get("/movie/:movieId", (c) => {
  try {
    const movieId = parseInt(c.req.param("movieId"));
    if (isNaN(movieId))
      return c.json({ success: false, error: "Invalid movie ID" }, 400);

    const item = selectWatchlistByMovieId(movieId);
    if (!item) return c.json({ success: true, data: null });

    const [populated] = attachMediaToWatchlistItems([item]);
    return c.json({ success: true, data: populated });
  } catch (err: unknown) {
    console.error("Error checking watchlist:", err);
    return c.json(
      {
        success: false,
        error: "Failed to check watchlist",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

// ── GET /watchlist/show/:showId ───────────────────────────────────────────────

router.get("/show/:showId", (c) => {
  try {
    const showId = parseInt(c.req.param("showId"));
    if (isNaN(showId))
      return c.json({ success: false, error: "Invalid show ID" }, 400);

    const item = selectWatchlistByShowId(showId);
    if (!item) return c.json({ success: true, data: null });

    const [populated] = attachMediaToWatchlistItems([item]);
    return c.json({ success: true, data: populated });
  } catch (err: unknown) {
    console.error("Error checking watchlist:", err);
    return c.json(
      {
        success: false,
        error: "Failed to check watchlist",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

// ── Continue Watching (TV) ───────────────────────────────────────────────────
// Declared BEFORE /:id to prevent matching /tv/continue-watching as /:id

router.get("/tv/continue-watching", (c) => {
  try {
    const user = c.get("user");
    const userId = user?.id;
    if (!userId) return c.json({ success: false, error: "Unauthorized" }, 401);

    const progress = db
      .select({
        show_id: userWatchedEpisodesTable.show_id,
        max_season: sql<number>`MAX(${userWatchedEpisodesTable.season_number})`,
        max_episode: sql<number>`MAX(${userWatchedEpisodesTable.episode_number})`,
      })
      .from(userWatchedEpisodesTable)
      .where(eq(userWatchedEpisodesTable.user_id, userId))
      .groupBy(userWatchedEpisodesTable.show_id)
      .all();

    if (!progress.length) {
      return c.json({ success: true, data: [] });
    }

    const nextEpisodes = [];

    for (const p of progress) {
      const nextEp = db
        .select({
          id: tvEpisodesTable.id,
          uuid: tvEpisodesTable.uuid,
          season_id: tvEpisodesTable.season_id,
          show_id: tvEpisodesTable.show_id,
          episode_number: tvEpisodesTable.episode_number,
          title: tvEpisodesTable.title,
          overview: tvEpisodesTable.overview,
          air_date: tvEpisodesTable.air_date,
          runtime: tvEpisodesTable.runtime,
          still_url: tvEpisodesTable.still_url,
          tmdb_id: tvEpisodesTable.tmdb_id,
          imdb_id: tvEpisodesTable.imdb_id,
          tmdb_still_path: tvEpisodesTable.tmdb_still_path,
        })
        .from(tvEpisodesTable)
        .innerJoin(
          tvSeasonsTable,
          eq(tvEpisodesTable.season_id, tvSeasonsTable.id),
        )
        .where(
          and(
            eq(tvEpisodesTable.show_id, p.show_id),
            or(
              and(
                eq(tvSeasonsTable.season_number, p.max_season),
                sql`${tvEpisodesTable.episode_number} > ${p.max_episode}`,
              ),
              sql`${tvSeasonsTable.season_number} > ${p.max_season}`,
            ),
          ),
        )
        .orderBy(
          asc(tvSeasonsTable.season_number),
          asc(tvEpisodesTable.episode_number),
        )
        .limit(1)
        .get() as TVEpisode | undefined;

      if (nextEp) {
        const show = db
          .select()
          .from(tvShowsTable)
          .where(eq(tvShowsTable.id, p.show_id))
          .get() as TVShow | undefined;

        if (show) {
          const resolvedShow = {
            ...show,
            poster_url:
              resolveImage(show.tmdb_poster_path, null) || show.poster_url,
            backdrop_url:
              resolveImage(show.tmdb_backdrop_path, null, "w780") ||
              show.backdrop_url,
          };
          const resolvedNextEp = {
            ...nextEp,
            still_url:
              resolveImage(nextEp.tmdb_still_path, null) || nextEp.still_url,
          };

          nextEpisodes.push({
            show: resolvedShow,
            nextEpisode: resolvedNextEp,
            progressPercentage: 0,
          });
        }
      }
    }

    return c.json({ success: true, data: nextEpisodes });
  } catch (err: unknown) {
    console.error("Error fetching continue watching:", err);
    return c.json(
      {
        success: false,
        error: "Failed to fetch continue watching feed",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

router.get("/tv/:showId/watched-episodes", (c) => {
  try {
    const user = c.get("user");
    const userId = user?.id;
    if (!userId) return c.json({ success: false, error: "Unauthorized" }, 401);

    const showId = parseInt(c.req.param("showId"));
    if (isNaN(showId))
      return c.json({ success: false, error: "Invalid show ID" }, 400);

    const episodes = db
      .select({ episode_id: userWatchedEpisodesTable.episode_id })
      .from(userWatchedEpisodesTable)
      .where(
        and(
          eq(userWatchedEpisodesTable.user_id, userId),
          eq(userWatchedEpisodesTable.show_id, showId),
        ),
      )
      .all();

    return c.json({ success: true, data: episodes.map((e) => e.episode_id) });
  } catch (err: unknown) {
    console.error("Error fetching watched episodes:", err);
    return c.json(
      {
        success: false,
        error: "Failed to fetch watched episodes",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

router.post("/tv/:showId/episodes/:episodeId/watched", (c) => {
  try {
    const user = c.get("user");
    const userId = user?.id;
    if (!userId) return c.json({ success: false, error: "Unauthorized" }, 401);
    const showId = parseInt(c.req.param("showId"));
    const episodeId = parseInt(c.req.param("episodeId"));

    // Get episode info
    const episode = db
      .select({
        episode_number: tvEpisodesTable.episode_number,
        season_number: tvSeasonsTable.season_number,
        season_id: tvSeasonsTable.id,
      })
      .from(tvEpisodesTable)
      .innerJoin(
        tvSeasonsTable,
        eq(tvEpisodesTable.season_id, tvSeasonsTable.id),
      )
      .where(
        and(
          eq(tvEpisodesTable.id, episodeId),
          eq(tvEpisodesTable.show_id, showId),
        ),
      )
      .get();

    if (!episode)
      return c.json({ success: false, error: "Episode not found" }, 404);

    // Insert into user_watched_episodes
    db.insert(userWatchedEpisodesTable)
      .values({
        user_id: userId,
        show_id: showId,
        season_id: episode.season_id,
        episode_id: episodeId,
        season_number: episode.season_number,
        episode_number: episode.episode_number,
      })
      .onConflictDoNothing()
      .run();

    // Also update watchlist status to 'watching' if not already there
    db.insert(watchlistTable)
      .values({
        show_id: showId,
        status: "watching",
        source: "manual",
      })
      .onConflictDoUpdate({
        target: watchlistTable.show_id,
        set: { status: "watching" },
        where: eq(watchlistTable.status, "want_to_watch"),
      })
      .run();

    return c.json({ success: true, message: "Episode marked as watched" });
  } catch (err: unknown) {
    console.error("Error marking episode watched:", err);
    return c.json(
      {
        success: false,
        error: "Failed to mark episode watched",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

router.delete("/tv/:showId/episodes/:episodeId/watched", (c) => {
  try {
    const user = c.get("user");
    const userId = user?.id;
    if (!userId) return c.json({ success: false, error: "Unauthorized" }, 401);
    const episodeId = parseInt(c.req.param("episodeId"));

    db.delete(userWatchedEpisodesTable)
      .where(
        and(
          eq(userWatchedEpisodesTable.user_id, userId),
          eq(userWatchedEpisodesTable.episode_id, episodeId),
        ),
      )
      .run();

    return c.json({ success: true, message: "Episode unmarked as watched" });
  } catch (err: unknown) {
    console.error("Error unmarking episode:", err);
    return c.json(
      {
        success: false,
        error: "Failed to unmark episode",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

router.post("/tv/:showId/seasons/:seasonId/watched", (c) => {
  try {
    const user = c.get("user");
    const userId = user?.id;
    if (!userId) return c.json({ success: false, error: "Unauthorized" }, 401);
    const showId = parseInt(c.req.param("showId"));
    const seasonId = parseInt(c.req.param("seasonId"));

    // Get all episodes for this season
    const episodes = db
      .select({
        episode_id: tvEpisodesTable.id,
        episode_number: tvEpisodesTable.episode_number,
        season_number: tvSeasonsTable.season_number,
      })
      .from(tvEpisodesTable)
      .innerJoin(
        tvSeasonsTable,
        eq(tvEpisodesTable.season_id, tvSeasonsTable.id),
      )
      .where(
        and(
          eq(tvSeasonsTable.id, seasonId),
          eq(tvEpisodesTable.show_id, showId),
        ),
      )
      .all();

    if (!episodes.length) {
      return c.json(
        { success: false, error: "Season or episodes not found" },
        404,
      );
    }

    for (const ep of episodes) {
      db.insert(userWatchedEpisodesTable)
        .values({
          user_id: userId,
          show_id: showId,
          season_id: seasonId,
          episode_id: ep.episode_id,
          season_number: ep.season_number,
          episode_number: ep.episode_number,
        })
        .onConflictDoNothing()
        .run();
    }

    // Update watchlist
    db.insert(watchlistTable)
      .values({
        show_id: showId,
        status: "watching",
        source: "manual",
      })
      .onConflictDoUpdate({
        target: watchlistTable.show_id,
        set: { status: "watching" },
        where: eq(watchlistTable.status, "want_to_watch"),
      })
      .run();

    return c.json({ success: true, message: "Season marked as watched" });
  } catch (err: unknown) {
    console.error("Error marking season watched:", err);
    return c.json(
      {
        success: false,
        error: "Failed to mark season watched",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

// ── GET /watchlist ────────────────────────────────────────────────────────────

router.get("/", (c) => {
  try {
    const status = c.req.query("status");
    let items: WatchlistItem[];

    if (status) {
      const validStatuses = ["want_to_watch", "watching", "watched"];
      if (!validStatuses.includes(status)) {
        return c.json({ success: false, error: `Invalid status` }, 400);
      }
      items = selectWatchlistByStatus(status);
    } else {
      items = selectAllWatchlist();
    }

    const populatedItems = attachMediaToWatchlistItems(items);

    const grouped = populatedItems.reduce(
      (acc, item) => {
        if (!acc[item.status]) acc[item.status] = [];
        acc[item.status].push(item);
        return acc;
      },
      {} as Record<string, WatchlistPopulatedItem[]>,
    );

    return c.json({ success: true, data: { items: populatedItems, grouped } });
  } catch (err: unknown) {
    console.error("Error fetching watchlist:", err);
    return c.json(
      {
        success: false,
        error: "Failed to fetch watchlist",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

// ── GET /watchlist/:id ────────────────────────────────────────────────────────

router.get("/:id", (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id))
      return c.json({ success: false, error: "Invalid watchlist ID" }, 400);

    const item = selectWatchlistById(id);
    if (!item)
      return c.json({ success: false, error: "Watchlist item not found" }, 404);

    const [populated] = attachMediaToWatchlistItems([item]);
    return c.json({ success: true, data: populated });
  } catch (err: unknown) {
    console.error("Error fetching watchlist item:", err);
    return c.json(
      {
        success: false,
        error: "Failed to fetch watchlist item",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

// ── POST /watchlist ───────────────────────────────────────────────────────────

router.post("/", async (c) => {
  try {
    const body = await c.req
      .json<AddToWatchlistRequest>()
      .catch(() => ({} as AddToWatchlistRequest));
    const {
      movie_id,
      show_id,
      status = "want_to_watch",
      user_rating = null,
      liked = 0,
      review_text = null,
      watch_count = 0,
      last_watched_at = null,
      source = "manual",
    } = body;

    if (!movie_id && !show_id) {
      return c.json(
        { success: false, error: "movie_id or show_id is required" },
        400,
      );
    }

    const validStatuses = ["want_to_watch", "watching", "watched"];
    if (!validStatuses.includes(status)) {
      return c.json({ success: false, error: `Invalid status` }, 400);
    }

    let watchlistId: number;

    if (movie_id) {
      const exists = db
        .select({ id: moviesTable.id })
        .from(moviesTable)
        .where(eq(moviesTable.id, movie_id))
        .get();
      if (!exists)
        return c.json({ success: false, error: "Movie not found" }, 404);

      const existing = selectWatchlistByMovieId(movie_id);
      if (existing)
        return c.json(
          {
            success: false,
            error: "Movie already in watchlist",
            existingItem: existing,
          },
          409,
        );

      const info = db
        .insert(watchlistTable)
        .values({
          movie_id,
          status,
          user_rating,
          liked: liked ? 1 : 0,
          review_text,
          watch_count,
          last_watched_at,
          source,
        })
        .run();
      watchlistId = Number(info.lastInsertRowid);
    } else {
      const exists = db
        .select({ id: tvShowsTable.id })
        .from(tvShowsTable)
        .where(eq(tvShowsTable.id, show_id!))
        .get();
      if (!exists)
        return c.json({ success: false, error: "Show not found" }, 404);

      const existing = selectWatchlistByShowId(show_id!);
      if (existing)
        return c.json(
          {
            success: false,
            error: "Show already in watchlist",
            existingItem: existing,
          },
          409,
        );

      const info = db
        .insert(watchlistTable)
        .values({
          show_id: show_id!,
          status,
          user_rating,
          liked: liked ? 1 : 0,
          review_text,
          watch_count,
          last_watched_at,
          source,
        })
        .run();
      watchlistId = Number(info.lastInsertRowid);
    }

    const item = selectWatchlistById(watchlistId)!;
    const [populated] = attachMediaToWatchlistItems([item]);

    invalidateWatchlistCache();
    return c.json(
      { success: true, message: "Added to watchlist", data: populated },
      201,
    );
  } catch (err: unknown) {
    console.error("Error adding to watchlist:", err);
    return c.json(
      {
        success: false,
        error: "Failed to add to watchlist",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

// ── PATCH /watchlist/:id ──────────────────────────────────────────────────────

router.patch("/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id))
      return c.json({ success: false, error: "Invalid watchlist ID" }, 400);

    const existing = selectWatchlistById(id);
    if (!existing)
      return c.json({ success: false, error: "Watchlist item not found" }, 404);

    const body = await c.req
      .json<UpdateWatchlistRequest>()
      .catch(() => ({} as UpdateWatchlistRequest));
    const {
      status,
      notes,
      watched_at,
      user_rating,
      liked,
      review_text,
      watch_count,
      last_watched_at,
      source,
    } = body;

    if (status) {
      const validStatuses = ["want_to_watch", "watching", "watched"];
      if (!validStatuses.includes(status)) {
        return c.json({ success: false, error: `Invalid status` }, 400);
      }
    }

    const newStatus = status ?? existing.status;
    const newNotes = notes ?? existing.notes ?? null;
    const newWatchedAt =
      watched_at !== undefined
        ? watched_at
        : newStatus === "watched" && !existing.watched_at
          ? new Date().toISOString()
          : (existing.watched_at ?? null);

    const newUserRating =
      user_rating !== undefined ? user_rating : existing.user_rating ?? null;
    const newLiked =
      liked !== undefined
        ? liked
          ? 1
          : 0
        : existing.liked
          ? 1
          : 0;
    const newReviewText =
      review_text !== undefined ? review_text : existing.review_text ?? null;
    const newWatchCount =
      watch_count !== undefined ? watch_count : existing.watch_count ?? 0;
    const newLastWatchedAt =
      last_watched_at !== undefined
        ? last_watched_at
        : existing.last_watched_at ?? null;
    const newSource = source !== undefined ? source : existing.source ?? null;

    db.update(watchlistTable)
      .set({
        status: newStatus,
        watched_at: newWatchedAt,
        notes: newNotes,
        user_rating: newUserRating,
        liked: newLiked,
        review_text: newReviewText,
        watch_count: newWatchCount,
        last_watched_at: newLastWatchedAt,
        source: newSource,
        updated_at: sql`datetime('now')`,
      })
      .where(eq(watchlistTable.id, id))
      .run();

    const item = selectWatchlistById(id)!;
    const [populated] = attachMediaToWatchlistItems([item]);

    invalidateWatchlistCache();
    return c.json({
      success: true,
      message: "Watchlist item updated",
      data: populated,
    });
  } catch (err: unknown) {
    console.error("Error updating watchlist:", err);
    return c.json(
      {
        success: false,
        error: "Failed to update watchlist",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

// ── DELETE /watchlist/:id ─────────────────────────────────────────────────────

router.delete("/:id", (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id))
      return c.json({ success: false, error: "Invalid watchlist ID" }, 400);

    const item = selectWatchlistById(id);
    if (!item)
      return c.json({ success: false, error: "Watchlist item not found" }, 404);

    db.delete(watchlistTable).where(eq(watchlistTable.id, id)).run();

    invalidateWatchlistCache();
    return c.json({
      success: true,
      message: "Removed from watchlist",
      data: { id: item.id },
    });
  } catch (err: unknown) {
    console.error("Error deleting from watchlist:", err);
    return c.json(
      {
        success: false,
        error: "Failed to remove from watchlist",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

export default router;
