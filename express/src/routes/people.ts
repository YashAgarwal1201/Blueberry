// src/routes/people.ts
import express, { Request, Response, Router } from "express";
import db from "../db";
import type { Person, CreatePersonRequest, IdParam } from "shared-types";
import { resolveImage } from "../utils/imageUtils";

const router: Router = express.Router();

// GET /people?search=
router.get("/", (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let people: Person[];

    if (search && typeof search === "string" && search.trim().length > 0) {
      people = db
        .prepare(
          `SELECT * FROM people
           WHERE name LIKE ? OR also_known_as LIKE ?
           ORDER BY name ASC LIMIT 50`,
        )
        .all(`%${search.trim()}%`, `%${search.trim()}%`) as Person[];
    } else {
      people = db
        .prepare(`SELECT * FROM people ORDER BY name ASC LIMIT 100`)
        .all() as Person[];
    }
    const resolved = people.map((p) => ({
      ...p,
      profile_url: resolveImage(p.tmdb_profile_path, p.local_profile_url, 'w185') || p.profile_url
    }));

    res.json({ success: true, data: resolved });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch people",
      message: err.message,
    });
  }
});

// GET /people/:id
router.get("/:id", (req: Request<IdParam>, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id))
      return res.status(400).json({ success: false, error: "Invalid ID" });

    const person = db.prepare(`SELECT * FROM people WHERE id = ?`).get(id) as
      | Person
      | undefined;
    if (!person)
      return res
        .status(404)
        .json({ success: false, error: "Person not found" });

    // Also fetch their filmography
    const filmography = db
      .prepare(
        `SELECT m.id, m.title, m.release_year, m.poster_url, m.tmdb_poster_path, m.local_poster_url, mc.role, mc.character
         FROM movies m
         JOIN movie_cast mc ON m.id = mc.movie_id
         WHERE mc.person_id = ?
         ORDER BY m.release_year DESC NULLS LAST`,
      )
      .all(id) as any[];

    const resolvedPerson = {
      ...person,
      profile_url: resolveImage(person.tmdb_profile_path, person.local_profile_url, 'h632') || person.profile_url
    };

    const resolvedFilmography = filmography.map((m) => ({
      ...m,
      poster_url: resolveImage(m.tmdb_poster_path, m.local_poster_url) || m.poster_url
    }));

    res.json({ success: true, data: { ...resolvedPerson, filmography: resolvedFilmography } });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch person",
      message: err.message,
    });
  }
});

// POST /people
router.post("/", (req: Request, res: Response) => {
  try {
    const body = req.body as CreatePersonRequest;

    if (!body.name?.trim())
      return res
        .status(400)
        .json({ success: false, error: "Name is required" });

    // Check duplicate by name (case-insensitive)
    const existing = db
      .prepare(`SELECT id FROM people WHERE name = ? COLLATE NOCASE`)
      .get(body.name.trim()) as { id: number } | undefined;

    if (existing) {
      return res.status(409).json({
        success: false,
        error: "A person with this name already exists",
        existing_id: existing.id,
      });
    }

    const personId = db.transaction(() => {
      const info = db
        .prepare(
          `INSERT INTO people (
            name, also_known_as, bio, birth_date, birth_place, profile_url, 
            tmdb_id, imdb_id, death_date, gender, known_for_department, 
            wikidata_id, homepage, popularity
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          body.name.trim(),
          body.also_known_as?.trim() ?? null,
          body.bio?.trim() ?? null,
          body.birth_date ?? null,
          body.birth_place?.trim() ?? null,
          body.profile_url?.trim() ?? null,
          body.tmdb_id ?? null,
          body.imdb_id?.trim() ?? null,
          body.death_date ?? null,
          body.gender ?? null,
          body.known_for_department?.trim() ?? null,
          body.wikidata_id?.trim() ?? null,
          body.homepage?.trim() ?? null,
          body.popularity ?? null,
        );

      const newId = info.lastInsertRowid as number;

      if (body.known_for && body.known_for.length > 0) {
        const stmt = db.prepare(
          `INSERT OR IGNORE INTO person_known_for (person_id, movie_id, show_id, display_order)
           VALUES (?, ?, ?, ?)`
        );
        body.known_for.forEach((item, index) => {
          if (item.movie_id || item.show_id) {
            stmt.run(newId, item.movie_id ?? null, item.show_id ?? null, item.display_order ?? index);
          }
        });
      }

      return newId;
    })();

    const person = db
      .prepare(`SELECT * FROM people WHERE id = ?`)
      .get(personId) as Person;
    res
      .status(201)
      .json({ success: true, message: "Person created successfully", data: person });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to create person",
      message: err.message,
    });
  }
});

// PUT /people/:id
router.put("/:id", (req: Request<IdParam>, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id))
      return res.status(400).json({ success: false, error: "Invalid ID" });

    const existing = db.prepare(`SELECT * FROM people WHERE id = ?`).get(id) as
      | Person
      | undefined;
    if (!existing)
      return res
        .status(404)
        .json({ success: false, error: "Person not found" });

    const body = req.body as Partial<CreatePersonRequest>;

    db.transaction(() => {
      db.prepare(
        `UPDATE people SET
          name = ?, also_known_as = ?, bio = ?, birth_date = ?,
          birth_place = ?, profile_url = ?, tmdb_id = ?, imdb_id = ?,
          death_date = ?, gender = ?, known_for_department = ?,
          wikidata_id = ?, homepage = ?, popularity = ?
         WHERE id = ?`,
      ).run(
        body.name?.trim() ?? existing.name,
        body.also_known_as?.trim() ?? existing.also_known_as ?? null,
        body.bio?.trim() ?? existing.bio ?? null,
        body.birth_date ?? existing.birth_date ?? null,
        body.birth_place?.trim() ?? existing.birth_place ?? null,
        body.profile_url?.trim() ?? existing.profile_url ?? null,
        body.tmdb_id ?? existing.tmdb_id ?? null,
        body.imdb_id?.trim() ?? existing.imdb_id ?? null,
        body.death_date ?? existing.death_date ?? null,
        body.gender ?? existing.gender ?? null,
        body.known_for_department?.trim() ?? existing.known_for_department ?? null,
        body.wikidata_id?.trim() ?? existing.wikidata_id ?? null,
        body.homepage?.trim() ?? existing.homepage ?? null,
        body.popularity ?? existing.popularity ?? null,
        id,
      );

      if (body.known_for !== undefined) {
        db.prepare(`DELETE FROM person_known_for WHERE person_id = ?`).run(id);
        const stmt = db.prepare(
          `INSERT OR IGNORE INTO person_known_for (person_id, movie_id, show_id, display_order)
           VALUES (?, ?, ?, ?)`
        );
        body.known_for.forEach((item, index) => {
          if (item.movie_id || item.show_id) {
            stmt.run(id, item.movie_id ?? null, item.show_id ?? null, item.display_order ?? index);
          }
        });
      }
    })();

    const updated = db
      .prepare(`SELECT * FROM people WHERE id = ?`)
      .get(id) as Person;
    res.json({
      success: true,
      message: "Person updated successfully",
      data: updated,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to update person",
      message: err.message,
    });
  }
});

// DELETE /people/:id
router.delete("/:id", (req: Request<IdParam>, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id))
      return res.status(400).json({ success: false, error: "Invalid ID" });

    const person = db
      .prepare(`SELECT id, name FROM people WHERE id = ?`)
      .get(id) as Pick<Person, "id" | "name"> | undefined;
    if (!person)
      return res
        .status(404)
        .json({ success: false, error: "Person not found" });

    // Guard: check if this person is cast in any movies
    const usage = db
      .prepare(`SELECT COUNT(*) as count FROM movie_cast WHERE person_id = ?`)
      .get(id) as { count: number };
    if (usage.count > 0) {
      return res.status(409).json({
        success: false,
        error: "Cannot delete a person who is credited in movies",
        movie_count: usage.count,
      });
    }

    db.prepare(`DELETE FROM people WHERE id = ?`).run(id);
    res.json({
      success: true,
      message: "Person deleted successfully",
      data: person,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to delete person",
      message: err.message,
    });
  }
});

export default router;
