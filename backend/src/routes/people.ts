// src/routes/people.ts
import { Hono } from "hono";
import db, {
  people as peopleTable,
  movies as moviesTable,
  movieCast as movieCastTable,
  personKnownFor as personKnownForTable,
} from "../db";
import { eq, or, like, asc, sql } from "drizzle-orm";
import type { Person, CreatePersonRequest, Movie } from "shared-types";
import { resolveImage } from "../utils/imageUtils";
import { getErrorMessage } from "../utils/errors";
import { requireAuth, requireModerator } from "../middleware/authMiddleware";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// GET /people?search=
router.get("/", (c) => {
  try {
    const search = c.req.query("search");
    let people: Person[];

    if (search && search.trim().length > 0) {
      const term = `%${search.trim()}%`;
      people = db
        .select()
        .from(peopleTable)
        .where(
          or(
            like(peopleTable.name, term),
            like(peopleTable.also_known_as, term),
          ),
        )
        .orderBy(asc(peopleTable.name))
        .limit(50)
        .all() as Person[];
    } else {
      people = db
        .select()
        .from(peopleTable)
        .orderBy(asc(peopleTable.name))
        .limit(100)
        .all() as Person[];
    }

    const resolved = people.map((p) => ({
      ...p,
      profile_url:
        resolveImage(p.tmdb_profile_path, p.local_profile_url, "w185") ||
        p.profile_url,
    }));

    return c.json({ success: true, data: resolved });
  } catch (err: unknown) {
    return c.json(
      {
        success: false,
        error: "Failed to fetch people",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

// GET /people/:id
router.get("/:id", (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return c.json({ success: false, error: "Invalid ID" }, 400);

    const person = db
      .select()
      .from(peopleTable)
      .where(eq(peopleTable.id, id))
      .get() as Person | undefined;

    if (!person)
      return c.json({ success: false, error: "Person not found" }, 404);

    // Also fetch their filmography
    const filmography = db
      .select({
        id: moviesTable.id,
        title: moviesTable.title,
        release_year: moviesTable.release_year,
        poster_url: moviesTable.poster_url,
        tmdb_poster_path: moviesTable.tmdb_poster_path,
        local_poster_url: moviesTable.local_poster_url,
        role: movieCastTable.role,
        character: movieCastTable.character,
      })
      .from(moviesTable)
      .innerJoin(
        movieCastTable,
        eq(moviesTable.id, movieCastTable.movie_id),
      )
      .where(eq(movieCastTable.person_id, id))
      .orderBy(sql`${moviesTable.release_year} DESC NULLS LAST`)
      .all() as Array<
      Pick<
        Movie,
        | "id"
        | "title"
        | "release_year"
        | "poster_url"
        | "tmdb_poster_path"
        | "local_poster_url"
      > & { role?: string; character?: string }
    >;

    const resolvedPerson = {
      ...person,
      profile_url:
        resolveImage(person.tmdb_profile_path, person.local_profile_url, "h632") ||
        person.profile_url,
    };

    const resolvedFilmography = filmography.map((m) => ({
      ...m,
      poster_url:
        resolveImage(m.tmdb_poster_path, m.local_poster_url) || m.poster_url,
    }));

    return c.json({
      success: true,
      data: { ...resolvedPerson, filmography: resolvedFilmography },
    });
  } catch (err: unknown) {
    return c.json(
      {
        success: false,
        error: "Failed to fetch person",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

// POST /people
router.post("/", requireAuth, async (c) => {
  try {
    const body = await c.req
      .json<CreatePersonRequest>()
      .catch(() => ({} as CreatePersonRequest));

    if (!body.name?.trim())
      return c.json({ success: false, error: "Name is required" }, 400);

    // Check duplicate by name (case-insensitive)
    const existing = db
      .select({ id: peopleTable.id })
      .from(peopleTable)
      .where(sql`lower(${peopleTable.name}) = lower(${body.name.trim()})`)
      .get() as { id: number } | undefined;

    if (existing) {
      return c.json(
        {
          success: false,
          error: "A person with this name already exists",
          existing_id: existing.id,
        },
        409,
      );
    }

    const info = db
      .insert(peopleTable)
      .values({
        name: body.name.trim(),
        also_known_as: body.also_known_as?.trim() ?? null,
        bio: body.bio?.trim() ?? null,
        birth_date: body.birth_date ?? null,
        birth_place: body.birth_place?.trim() ?? null,
        profile_url: body.profile_url?.trim() ?? null,
        tmdb_id: body.tmdb_id ?? null,
        imdb_id: body.imdb_id?.trim() ?? null,
        death_date: body.death_date ?? null,
        gender: body.gender ?? null,
        known_for_department: body.known_for_department?.trim() ?? null,
        wikidata_id: body.wikidata_id?.trim() ?? null,
        homepage: body.homepage?.trim() ?? null,
        popularity: body.popularity ?? null,
      })
      .run();

    const newId = Number(info.lastInsertRowid);

    if (body.known_for && body.known_for.length > 0) {
      for (const [index, item] of body.known_for.entries()) {
        if (item.movie_id || item.show_id) {
          db.insert(personKnownForTable)
            .values({
              person_id: newId,
              movie_id: item.movie_id ?? null,
              show_id: item.show_id ?? null,
              display_order: item.display_order ?? index,
            })
            .onConflictDoNothing()
            .run();
        }
      }
    }

    const person = db
      .select()
      .from(peopleTable)
      .where(eq(peopleTable.id, newId))
      .get() as Person;

    return c.json(
      {
        success: true,
        message: "Person created successfully",
        data: person,
      },
      201,
    );
  } catch (err: unknown) {
    return c.json(
      {
        success: false,
        error: "Failed to create person",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

// PUT /people/:id
router.put("/:id", requireAuth, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return c.json({ success: false, error: "Invalid ID" }, 400);

    const existing = db
      .select()
      .from(peopleTable)
      .where(eq(peopleTable.id, id))
      .get() as Person | undefined;

    if (!existing)
      return c.json({ success: false, error: "Person not found" }, 404);

    const body = await c.req
      .json<Partial<CreatePersonRequest>>()
      .catch(() => ({} as Partial<CreatePersonRequest>));

    db.update(peopleTable)
      .set({
        name: body.name?.trim() ?? existing.name,
        also_known_as:
          body.also_known_as?.trim() ?? existing.also_known_as ?? null,
        bio: body.bio?.trim() ?? existing.bio ?? null,
        birth_date: body.birth_date ?? existing.birth_date ?? null,
        birth_place: body.birth_place?.trim() ?? existing.birth_place ?? null,
        profile_url: body.profile_url?.trim() ?? existing.profile_url ?? null,
        tmdb_id: body.tmdb_id ?? existing.tmdb_id ?? null,
        imdb_id: body.imdb_id?.trim() ?? existing.imdb_id ?? null,
        death_date: body.death_date ?? existing.death_date ?? null,
        gender: body.gender ?? existing.gender ?? null,
        known_for_department:
          body.known_for_department?.trim() ??
          existing.known_for_department ??
          null,
        wikidata_id: body.wikidata_id?.trim() ?? existing.wikidata_id ?? null,
        homepage: body.homepage?.trim() ?? existing.homepage ?? null,
        popularity: body.popularity ?? existing.popularity ?? null,
      })
      .where(eq(peopleTable.id, id))
      .run();

    if (body.known_for !== undefined) {
      db.delete(personKnownForTable)
        .where(eq(personKnownForTable.person_id, id))
        .run();

      for (const [index, item] of body.known_for.entries()) {
        if (item.movie_id || item.show_id) {
          db.insert(personKnownForTable)
            .values({
              person_id: id,
              movie_id: item.movie_id ?? null,
              show_id: item.show_id ?? null,
              display_order: item.display_order ?? index,
            })
            .onConflictDoNothing()
            .run();
        }
      }
    }

    const updated = db
      .select()
      .from(peopleTable)
      .where(eq(peopleTable.id, id))
      .get() as Person;

    return c.json({
      success: true,
      message: "Person updated successfully",
      data: updated,
    });
  } catch (err: unknown) {
    return c.json(
      {
        success: false,
        error: "Failed to update person",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

// DELETE /people/:id
router.delete("/:id", requireModerator, (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return c.json({ success: false, error: "Invalid ID" }, 400);

    const person = db
      .select({ id: peopleTable.id, name: peopleTable.name })
      .from(peopleTable)
      .where(eq(peopleTable.id, id))
      .get() as Pick<Person, "id" | "name"> | undefined;

    if (!person)
      return c.json({ success: false, error: "Person not found" }, 404);

    // Guard: check if this person is cast in any movies
    const usage = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(movieCastTable)
      .where(eq(movieCastTable.person_id, id))
      .get() as { count: number };

    if (usage && usage.count > 0) {
      return c.json(
        {
          success: false,
          error: "Cannot delete a person who is credited in movies",
          movie_count: usage.count,
        },
        409,
      );
    }

    db.delete(peopleTable).where(eq(peopleTable.id, id)).run();

    return c.json({
      success: true,
      message: "Person deleted successfully",
      data: person,
    });
  } catch (err: unknown) {
    return c.json(
      {
        success: false,
        error: "Failed to delete person",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

export default router;
