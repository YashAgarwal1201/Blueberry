import express, { Request, Response, Router } from "express";
import db from "../db";
import type {
  TVShowCard,
  TVShow,
  TVShowWithDetails,
  UuidParam,
  IdParam,
  Language,
  Genre,
  CastMember,
  Company,
  TVSeason,
  CreateTVShowRequest,
  UpdateTVShowRequest,
  CastMemberRequest,
  CompanyRequest,
} from "shared-types";
import { resolveImage } from "../utils/imageUtils";

const router: Router = express.Router();

function clean(str?: string | null): string | null {
  if (str === undefined || str === null) return null;
  const t = str.trim();
  return t === "" ? null : t;
}

function getWatchlistSet(): Set<number> {
  const rows = db.prepare(`SELECT show_id FROM watchlist WHERE show_id IS NOT NULL`).all() as {
    show_id: number;
  }[];
  return new Set(rows.map((r) => r.show_id));
}

function toTVShowCards(shows: TVShow[], watchlistSet: Set<number>): TVShowCard[] {
  if (shows.length === 0) return [];
  const ids = shows.map((s) => s.id);
  const ph = ids.map(() => "?").join(",");

  const allGenres = db
    .prepare(
      `SELECT tg.show_id, g.id, g.name, g.slug
       FROM genres g
       JOIN tv_genres tg ON g.id = tg.genre_id
       WHERE tg.show_id IN (${ph})`,
    )
    .all(...ids) as Array<{
    show_id: number;
    id: number;
    name: string;
    slug: string;
  }>;

  const genreMap = new Map<number, { id: number; name: string; slug: string }[]>();
  allGenres.forEach(({ show_id, ...g }) => {
    if (!genreMap.has(show_id)) genreMap.set(show_id, []);
    genreMap.get(show_id)!.push(g);
  });

  return shows.map((s) => ({
    id: s.id,
    uuid: s.uuid,
    type: "tv",
    title: s.title,
    poster_url: resolveImage(s.tmdb_poster_path, null) || s.poster_url,
    backdrop_url: resolveImage(s.tmdb_backdrop_path, null, 'w780') || s.backdrop_url,
    release_year: s.first_air_date ? parseInt(s.first_air_date.substring(0, 4)) : undefined,
    status: s.status ?? "returning_series",
    tmdb_id: s.tmdb_id,
    in_watchlist: watchlistSet.has(s.id),
    genres: genreMap.get(s.id) ?? [],
  }));
}

function getTVShowWithDetails(identifier: string | number): TVShowWithDetails | undefined {
  const isUuid = typeof identifier === "string";
  const show = isUuid
    ? db.prepare(`SELECT * FROM tv_shows WHERE uuid = ?`).get(identifier) as TVShow | undefined
    : db.prepare(`SELECT * FROM tv_shows WHERE id = ?`).get(identifier) as TVShow | undefined;
  
  if (!show) return undefined;
  const id = show.id;

  const inWatchlist = !!db
    .prepare(`SELECT 1 FROM watchlist WHERE show_id = ?`)
    .get(id);

  const languages = db
    .prepare(
      `SELECT l.id, l.name, l.code, l.native_script
       FROM languages l
       JOIN tv_languages tl ON l.id = tl.language_id
       WHERE tl.show_id = ?`,
    )
    .all(id) as Language[];

  const genres = db
    .prepare(
      `SELECT g.id, g.name, g.slug, g.description, g.created_at
       FROM genres g
       JOIN tv_genres tg ON g.id = tg.genre_id
       WHERE tg.show_id = ?`,
    )
    .all(id) as Genre[];

  const cast = db
    .prepare(
      `SELECT p.id, p.name, p.also_known_as, p.profile_url, p.tmdb_id, p.imdb_id,
              p.tmdb_profile_path, p.local_profile_url,
              tc.role, tc.character, tc.display_order
       FROM people p
       JOIN tv_cast tc ON p.id = tc.person_id
       WHERE tc.show_id = ?
       ORDER BY tc.display_order ASC, tc.role ASC`,
    )
    .all(id) as CastMember[];

  const companies = db
    .prepare(
      `SELECT c.id, c.name, c.type, c.logo_url, c.country, c.tmdb_id, c.tmdb_logo_path, tc.role
       FROM companies c
       JOIN tv_companies tc ON c.id = tc.company_id
       WHERE tc.show_id = ?
       ORDER BY c.name ASC`,
    )
    .all(id) as (Company & { role: string })[];

  const seasons = db
    .prepare(`SELECT * FROM tv_seasons WHERE show_id = ? ORDER BY season_number ASC`)
    .all(id) as TVSeason[];

  return {
    ...show,
    keywords: show.keywords ? JSON.parse(show.keywords as unknown as string) : undefined,
    poster_url: resolveImage(show.tmdb_poster_path, null) || show.poster_url,
    backdrop_url: resolveImage(show.tmdb_backdrop_path, null, 'original') || show.backdrop_url,
    in_watchlist: inWatchlist,
    languages,
    genres,
    cast: cast.map((c: any) => ({
      ...c,
      profile_url: resolveImage(c.tmdb_profile_path, c.local_profile_url, 'w185') || c.profile_url
    })),
    companies: companies.map((c: any) => ({
      ...c,
      logo_url: resolveImage(c.tmdb_logo_path, null, 'w185') || c.logo_url
    })),
    seasons: seasons.map((s: any) => ({
      ...s,
      poster_url: resolveImage(s.tmdb_poster_path, null) || s.poster_url
    }))
  };
}

function upsertPerson(req: CastMemberRequest): number {
  if (req.person_id) return req.person_id;
  const existing = db
    .prepare(`SELECT id FROM people WHERE name = ? COLLATE NOCASE`)
    .get(req.name) as { id: number } | undefined;
  if (existing) return existing.id;
  const info = db
    .prepare(
      `INSERT INTO people (name, profile_url, tmdb_id, imdb_id) VALUES (?, ?, ?, ?)`,
    )
    .run(
      req.name.trim(),
      req.profile_url ?? null,
      req.tmdb_id ?? null,
      req.imdb_id ?? null,
    );
  return info.lastInsertRowid as number;
}

function upsertCompany(req: CompanyRequest): number {
  if (req.company_id) return req.company_id;
  const existing = db
    .prepare(`SELECT id FROM companies WHERE name = ? COLLATE NOCASE`)
    .get(req.name) as { id: number } | undefined;
  if (existing) return existing.id;
  const info = db
    .prepare(
      `INSERT INTO companies (name, type, logo_url, country) VALUES (?, ?, ?, ?)`,
    )
    .run(
      req.name.trim(),
      req.type ?? "production",
      req.logo_url ?? null,
      req.country ?? null,
    );
  return info.lastInsertRowid as number;
}

// ── GET /tv/recent ────────────────────────────────────────────────────────────
router.get("/recent", (_req: Request, res: Response) => {
  try {
    const shows = db
      .prepare(`SELECT * FROM tv_shows ORDER BY first_air_date DESC LIMIT 20`)
      .all() as TVShow[];
    const cards = toTVShowCards(shows, getWatchlistSet());
    res.json({ success: true, data: cards });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to fetch recent TV shows", message: err.message });
  }
});

// ── GET /tv/top-rated ─────────────────────────────────────────────────────────
router.get("/top-rated", (_req: Request, res: Response) => {
  try {
    const shows = db
      .prepare(`SELECT * FROM tv_shows ORDER BY rating_imdb DESC NULLS LAST, title ASC LIMIT 20`)
      .all() as TVShow[];
    const cards = toTVShowCards(shows, getWatchlistSet());
    res.json({ success: true, data: cards });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to fetch top-rated TV shows", message: err.message });
  }
});

// ── GET /tv ───────────────────────────────────────────────────────────────────
router.get("/", (req: Request, res: Response) => {
  try {
    const search = req.query.search as string | undefined;
    let query = "SELECT * FROM tv_shows";
    let params: any[] = [];
    
    if (search?.trim()) {
      query += " WHERE title LIKE ?";
      params.push(`%${search.trim()}%`);
    }
    
    query += " ORDER BY title ASC LIMIT 50";
    
    const shows = db.prepare(query).all(...params) as TVShow[];
    const cards = toTVShowCards(shows, getWatchlistSet());
    res.json({ success: true, data: cards });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to fetch TV shows", message: err.message });
  }
});

// ── GET /tv/:uuid ──────────────────────────────────────────────────────────────
router.get("/:uuid", (req: Request<UuidParam>, res: Response) => {
  try {
    const showWithDetails = getTVShowWithDetails(req.params.uuid);
    
    if (!showWithDetails) {
      return res.status(404).json({ success: false, error: "TV Show not found" });
    }

    res.json({ success: true, data: showWithDetails });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to fetch TV show", message: err.message });
  }
});

// ── POST /tv ───────────────────────────────────────────────────────────────────
router.post("/", (req: Request, res: Response) => {
  try {
    const body = req.body as CreateTVShowRequest;
    if (!body.title?.trim())
      return res.status(400).json({ success: false, error: "Title is required" });

    const result = db.transaction(() => {
      const info = db
        .prepare(
          `INSERT INTO tv_shows (
            uuid, title, tagline, description, status, first_air_date, last_air_date,
            network, origin_country, original_language, age_rating,
            imdb_id, tmdb_id, letterboxd_id, wikidata_id, poster_url, backdrop_url,
            budget, box_office, rating_imdb, rating_rt, rating_metacritic,
            episode_count, season_count, runtime_per_episode, keywords
          ) VALUES (lower(hex(randomblob(16))),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        )
        .run(
          body.title.trim(),
          clean(body.tagline),
          body.description?.trim() ?? "",
          body.status ?? "returning_series",
          body.first_air_date ?? null,
          body.last_air_date ?? null,
          clean(body.network),
          clean(body.origin_country),
          clean(body.original_language),
          clean(body.age_rating),
          clean(body.imdb_id),
          body.tmdb_id ?? null,
          clean(body.letterboxd_id),
          clean(body.wikidata_id),
          clean(body.poster_url),
          clean(body.backdrop_url),
          body.budget ?? null,
          body.box_office ?? null,
          body.rating_imdb ?? null,
          body.rating_rt ?? null,
          body.rating_metacritic ?? null,
          body.episode_count ?? 0,
          body.season_count ?? 0,
          body.runtime_per_episode ?? null,
          body.keywords ? JSON.stringify(body.keywords) : null,
        );
      
      const showId = info.lastInsertRowid as number;

      (body.language_ids ?? []).forEach((lid) =>
        db.prepare(`INSERT OR IGNORE INTO tv_languages (show_id, language_id) VALUES (?,?)`).run(showId, lid),
      );
      (body.genre_ids ?? []).forEach((gid) =>
        db.prepare(`INSERT OR IGNORE INTO tv_genres (show_id, genre_id) VALUES (?,?)`).run(showId, gid),
      );
      (body.cast ?? []).forEach((c, i) => {
        const personId = upsertPerson(c);
        db.prepare(
          `INSERT OR IGNORE INTO tv_cast (show_id, person_id, role, character, display_order) VALUES (?,?,?,?,?)`,
        ).run(showId, personId, c.role, c.character ?? null, c.display_order ?? i);
      });
      (body.companies ?? []).forEach((c) => {
        const companyId = upsertCompany(c);
        db.prepare(
          `INSERT OR IGNORE INTO tv_companies (show_id, company_id, role) VALUES (?,?,?)`,
        ).run(showId, companyId, c.role);
      });

      const uuid = db.prepare(`SELECT uuid FROM tv_shows WHERE id = ?`).get(showId) as { uuid: string };
      return getTVShowWithDetails(uuid.uuid)!;
    })();

    res.status(201).json({ success: true, message: "TV Show created successfully", data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to create TV show", message: err.message });
  }
});

// ── PUT /tv/:uuid ──────────────────────────────────────────────────────────────
router.put("/:uuid", (req: Request<UuidParam>, res: Response) => {
  try {
    const uuid = req.params.uuid;
    if (!uuid)
      return res.status(400).json({ success: false, error: "Invalid TV Show UUID" });

    const existing = db.prepare(`SELECT * FROM tv_shows WHERE uuid = ?`).get(uuid) as TVShow | undefined;
    if (!existing)
      return res.status(404).json({ success: false, error: "TV Show not found" });

    const id = existing.id;
    const body = req.body as UpdateTVShowRequest;

    const result = db.transaction(() => {
      db.prepare(
        `UPDATE tv_shows SET
          title = ?, tagline = ?, description = ?, status = ?,
          first_air_date = ?, last_air_date = ?, network = ?, origin_country = ?,
          original_language = ?, age_rating = ?,
          imdb_id = ?, tmdb_id = ?, letterboxd_id = ?, wikidata_id = ?, poster_url = ?, backdrop_url = ?,
          budget = ?, box_office = ?, rating_imdb = ?, rating_rt = ?, rating_metacritic = ?,
          episode_count = ?, season_count = ?, runtime_per_episode = ?, keywords = ?,
          updated_at = datetime('now')
         WHERE id = ?`,
      ).run(
        body.title?.trim() ?? existing.title,
        clean(body.tagline ?? existing.tagline),
        body.description?.trim() ?? existing.description ?? "",
        body.status ?? existing.status ?? "returning_series",
        body.first_air_date ?? existing.first_air_date ?? null,
        body.last_air_date ?? existing.last_air_date ?? null,
        clean(body.network ?? existing.network),
        clean(body.origin_country ?? existing.origin_country),
        clean(body.original_language ?? existing.original_language),
        clean(body.age_rating ?? existing.age_rating),
        clean(body.imdb_id ?? existing.imdb_id),
        body.tmdb_id ?? existing.tmdb_id ?? null,
        clean(body.letterboxd_id ?? existing.letterboxd_id),
        clean(body.wikidata_id ?? existing.wikidata_id),
        clean(body.poster_url ?? existing.poster_url),
        clean(body.backdrop_url ?? existing.backdrop_url),
        body.budget ?? existing.budget ?? null,
        body.box_office ?? existing.box_office ?? null,
        body.rating_imdb ?? existing.rating_imdb ?? null,
        body.rating_rt ?? existing.rating_rt ?? null,
        body.rating_metacritic ?? existing.rating_metacritic ?? null,
        body.episode_count ?? existing.episode_count ?? 0,
        body.season_count ?? existing.season_count ?? 0,
        body.runtime_per_episode ?? existing.runtime_per_episode ?? null,
        body.keywords ? JSON.stringify(body.keywords) : (existing as any).keywords ?? null,
        id,
      );

      if (body.language_ids !== undefined) {
        db.prepare(`DELETE FROM tv_languages WHERE show_id = ?`).run(id);
        body.language_ids.forEach((lid) =>
          db.prepare(`INSERT OR IGNORE INTO tv_languages (show_id, language_id) VALUES (?,?)`).run(id, lid),
        );
      }
      if (body.genre_ids !== undefined) {
        db.prepare(`DELETE FROM tv_genres WHERE show_id = ?`).run(id);
        body.genre_ids.forEach((gid) =>
          db.prepare(`INSERT OR IGNORE INTO tv_genres (show_id, genre_id) VALUES (?,?)`).run(id, gid),
        );
      }
      if (body.cast !== undefined) {
        db.prepare(`DELETE FROM tv_cast WHERE show_id = ?`).run(id);
        body.cast.forEach((c, i) => {
          const personId = upsertPerson(c);
          db.prepare(
            `INSERT OR IGNORE INTO tv_cast (show_id, person_id, role, character, display_order) VALUES (?,?,?,?,?)`,
          ).run(id, personId, c.role, c.character ?? null, c.display_order ?? i);
        });
      }
      if (body.companies !== undefined) {
        db.prepare(`DELETE FROM tv_companies WHERE show_id = ?`).run(id);
        body.companies.forEach((c) => {
          const companyId = upsertCompany(c);
          db.prepare(
            `INSERT OR IGNORE INTO tv_companies (show_id, company_id, role) VALUES (?,?,?)`,
          ).run(id, companyId, c.role);
        });
      }

      return getTVShowWithDetails(uuid)!;
    })();

    res.json({ success: true, message: "TV Show updated successfully", data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to update TV show", message: err.message });
  }
});

// ── DELETE /tv/:uuid ───────────────────────────────────────────────────────────
router.delete("/:uuid", (req: Request<UuidParam>, res: Response) => {
  try {
    const uuid = req.params.uuid;
    const existing = db.prepare(`SELECT id, title FROM tv_shows WHERE uuid = ?`).get(uuid) as Pick<TVShow, "id" | "title"> | undefined;

    if (!existing)
      return res.status(404).json({ success: false, error: "TV Show not found" });

    db.transaction(() => {
      // Junction tables have ON DELETE CASCADE so deleting the show cleans them up
      db.prepare(`DELETE FROM tv_shows WHERE id = ?`).run(existing.id);
    })();

    res.json({ success: true, message: "TV Show deleted successfully", data: { id: existing.id } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: "Failed to delete TV show", message: err.message });
  }
});

export default router;
