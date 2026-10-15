// src/routes/companies.ts
import { Hono } from "hono";
import db, {
  companies as companiesTable,
  movies as moviesTable,
  movieCompanies as movieCompaniesTable,
} from "../db";
import { eq, like, and, asc, sql } from "drizzle-orm";
import type { Company, CreateCompanyRequest, Movie } from "shared-types";
import { resolveImage } from "../utils/imageUtils";
import { getErrorMessage } from "../utils/errors";
import { requireAuth, requireModerator } from "../middleware/authMiddleware";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

// GET /companies?search=&type=
router.get("/", (c) => {
  try {
    const search = c.req.query("search");
    const type = c.req.query("type");

    const conditions = [];

    if (search && search.trim().length > 0) {
      conditions.push(like(companiesTable.name, `%${search.trim()}%`));
    }

    if (type) {
      conditions.push(eq(companiesTable.type, type));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = search ? 50 : 100;

    let query = db
      .select()
      .from(companiesTable)
      .orderBy(asc(companiesTable.name))
      .limit(limit);

    const companies = (
      whereClause ? query.where(whereClause).all() : query.all()
    ) as Company[];

    const resolved = companies.map((co) => ({
      ...co,
      logo_url: resolveImage(co.tmdb_logo_path, null, "w185") || co.logo_url,
    }));

    return c.json({ success: true, data: resolved });
  } catch (err: unknown) {
    return c.json(
      {
        success: false,
        error: "Failed to fetch companies",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

// GET /companies/:id
router.get("/:id", (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return c.json({ success: false, error: "Invalid ID" }, 400);

    const company = db
      .select()
      .from(companiesTable)
      .where(eq(companiesTable.id, id))
      .get() as Company | undefined;

    if (!company)
      return c.json({ success: false, error: "Company not found" }, 404);

    const movies = db
      .select({
        id: moviesTable.id,
        title: moviesTable.title,
        release_year: moviesTable.release_year,
        poster_url: moviesTable.poster_url,
        tmdb_poster_path: moviesTable.tmdb_poster_path,
        local_poster_url: moviesTable.local_poster_url,
        role: movieCompaniesTable.role,
      })
      .from(moviesTable)
      .innerJoin(
        movieCompaniesTable,
        eq(moviesTable.id, movieCompaniesTable.movie_id),
      )
      .where(eq(movieCompaniesTable.company_id, id))
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
      > & { role?: string }
    >;

    const resolvedCompany = {
      ...company,
      logo_url:
        resolveImage(company.tmdb_logo_path, null, "w185") || company.logo_url,
    };

    const resolvedMovies = movies.map((m) => ({
      ...m,
      poster_url:
        resolveImage(m.tmdb_poster_path, m.local_poster_url) || m.poster_url,
    }));

    return c.json({
      success: true,
      data: { ...resolvedCompany, movies: resolvedMovies },
    });
  } catch (err: unknown) {
    return c.json(
      {
        success: false,
        error: "Failed to fetch company",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

// POST /companies
router.post("/", requireAuth, async (c) => {
  try {
    const body = await c.req
      .json<CreateCompanyRequest>()
      .catch(() => ({} as CreateCompanyRequest));

    if (!body.name?.trim())
      return c.json({ success: false, error: "Name is required" }, 400);

    const existing = db
      .select({ id: companiesTable.id })
      .from(companiesTable)
      .where(sql`lower(${companiesTable.name}) = lower(${body.name.trim()})`)
      .get() as { id: number } | undefined;

    if (existing) {
      return c.json(
        {
          success: false,
          error: "A company with this name already exists",
          existing_id: existing.id,
        },
        409,
      );
    }

    const info = db
      .insert(companiesTable)
      .values({
        name: body.name.trim(),
        type: body.type ?? "production",
        logo_url: body.logo_url?.trim() ?? null,
        country: body.country?.trim() ?? null,
        tmdb_id: body.tmdb_id ?? null,
      })
      .run();

    const company = db
      .select()
      .from(companiesTable)
      .where(eq(companiesTable.id, Number(info.lastInsertRowid)))
      .get() as Company;

    return c.json(
      {
        success: true,
        message: "Company created successfully",
        data: company,
      },
      201,
    );
  } catch (err: unknown) {
    return c.json(
      {
        success: false,
        error: "Failed to create company",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

// PUT /companies/:id
router.put("/:id", requireAuth, async (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return c.json({ success: false, error: "Invalid ID" }, 400);

    const existing = db
      .select()
      .from(companiesTable)
      .where(eq(companiesTable.id, id))
      .get() as Company | undefined;

    if (!existing)
      return c.json({ success: false, error: "Company not found" }, 404);

    const body = await c.req
      .json<Partial<CreateCompanyRequest>>()
      .catch(() => ({} as Partial<CreateCompanyRequest>));

    db.update(companiesTable)
      .set({
        name: body.name?.trim() ?? existing.name,
        type: body.type ?? existing.type,
        logo_url: body.logo_url?.trim() ?? existing.logo_url ?? null,
        country: body.country?.trim() ?? existing.country ?? null,
        tmdb_id: body.tmdb_id ?? existing.tmdb_id ?? null,
      })
      .where(eq(companiesTable.id, id))
      .run();

    const updated = db
      .select()
      .from(companiesTable)
      .where(eq(companiesTable.id, id))
      .get() as Company;

    return c.json({
      success: true,
      message: "Company updated successfully",
      data: updated,
    });
  } catch (err: unknown) {
    return c.json(
      {
        success: false,
        error: "Failed to update company",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

// DELETE /companies/:id
router.delete("/:id", requireModerator, (c) => {
  try {
    const id = parseInt(c.req.param("id"));
    if (isNaN(id)) return c.json({ success: false, error: "Invalid ID" }, 400);

    const company = db
      .select({ id: companiesTable.id, name: companiesTable.name })
      .from(companiesTable)
      .where(eq(companiesTable.id, id))
      .get() as Pick<Company, "id" | "name"> | undefined;

    if (!company)
      return c.json({ success: false, error: "Company not found" }, 404);

    const usage = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(movieCompaniesTable)
      .where(eq(movieCompaniesTable.company_id, id))
      .get() as { count: number };

    if (usage && usage.count > 0) {
      return c.json(
        {
          success: false,
          error: "Cannot delete a company that is credited in movies",
          movie_count: usage.count,
        },
        409,
      );
    }

    db.delete(companiesTable).where(eq(companiesTable.id, id)).run();

    return c.json({
      success: true,
      message: "Company deleted successfully",
      data: company,
    });
  } catch (err: unknown) {
    return c.json(
      {
        success: false,
        error: "Failed to delete company",
        message: getErrorMessage(err),
      },
      500,
    );
  }
});

export default router;
