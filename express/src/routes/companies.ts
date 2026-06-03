// src/routes/companies.ts
import express, { Request, Response, Router } from "express";
import db from "../db";
import type { Company, CreateCompanyRequest, IdParam } from "../types.ts";

const router: Router = express.Router();

// GET /companies?search=&type=
router.get("/", (req: Request, res: Response) => {
  try {
    const { search, type } = req.query;
    let companies: Company[];

    if (search && typeof search === "string" && search.trim().length > 0) {
      companies = db
        .prepare(
          `SELECT * FROM companies WHERE name LIKE ? ORDER BY name ASC LIMIT 50`,
        )
        .all(`%${search.trim()}%`) as Company[];
    } else {
      companies = db
        .prepare(`SELECT * FROM companies ORDER BY name ASC`)
        .all() as Company[];
    }

    if (type && typeof type === "string") {
      companies = companies.filter((c) => c.type === type);
    }

    res.json({ success: true, count: companies.length, companies });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch companies",
      message: err.message,
    });
  }
});

// GET /companies/:id
router.get("/:id", (req: Request<IdParam>, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id))
      return res.status(400).json({ success: false, error: "Invalid ID" });

    const company = db
      .prepare(`SELECT * FROM companies WHERE id = ?`)
      .get(id) as Company | undefined;
    if (!company)
      return res
        .status(404)
        .json({ success: false, error: "Company not found" });

    const movies = db
      .prepare(
        `
      SELECT m.id, m.title, m.release_year, m.poster_url, mco.role
      FROM movies m
      JOIN movie_companies mco ON m.id = mco.movie_id
      WHERE mco.company_id = ?
      ORDER BY m.release_year DESC NULLS LAST
    `,
      )
      .all(id);

    res.json({ success: true, company: { ...company, movies } });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch company",
      message: err.message,
    });
  }
});

// POST /companies
router.post("/", (req: Request, res: Response) => {
  try {
    const body = req.body as CreateCompanyRequest;

    if (!body.name?.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Name is required" });
    }

    const existing = db
      .prepare(`SELECT id FROM companies WHERE name = ? COLLATE NOCASE`)
      .get(body.name.trim()) as { id: number } | undefined;

    if (existing) {
      return res.status(409).json({
        success: false,
        error: "A company with this name already exists",
        existing_id: existing.id,
      });
    }

    const info = db
      .prepare(
        `
      INSERT INTO companies (name, type, logo_url, country, tmdb_id)
      VALUES (?, ?, ?, ?, ?)
    `,
      )
      .run(
        body.name.trim(),
        body.type ?? "production",
        body.logo_url?.trim() ?? null,
        body.country?.trim() ?? null,
        body.tmdb_id ?? null,
      );

    const company = db
      .prepare(`SELECT * FROM companies WHERE id = ?`)
      .get(info.lastInsertRowid) as Company;
    res.status(201).json({
      success: true,
      message: "Company created successfully",
      company,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to create company",
      message: err.message,
    });
  }
});

// PUT /companies/:id
router.put("/:id", (req: Request<IdParam>, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id))
      return res.status(400).json({ success: false, error: "Invalid ID" });

    const existing = db
      .prepare(`SELECT * FROM companies WHERE id = ?`)
      .get(id) as Company | undefined;
    if (!existing)
      return res
        .status(404)
        .json({ success: false, error: "Company not found" });

    const body = req.body as Partial<CreateCompanyRequest>;

    db.prepare(
      `
      UPDATE companies SET name = ?, type = ?, logo_url = ?, country = ?, tmdb_id = ?
      WHERE id = ?
    `,
    ).run(
      body.name?.trim() ?? existing.name,
      body.type ?? existing.type,
      body.logo_url?.trim() ?? existing.logo_url ?? null,
      body.country?.trim() ?? existing.country ?? null,
      body.tmdb_id ?? existing.tmdb_id ?? null,
      id,
    );

    const updated = db
      .prepare(`SELECT * FROM companies WHERE id = ?`)
      .get(id) as Company;
    res.json({
      success: true,
      message: "Company updated successfully",
      company: updated,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to update company",
      message: err.message,
    });
  }
});

// DELETE /companies/:id
router.delete("/:id", (req: Request<IdParam>, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id))
      return res.status(400).json({ success: false, error: "Invalid ID" });

    const company = db
      .prepare(`SELECT id, name FROM companies WHERE id = ?`)
      .get(id) as Pick<Company, "id" | "name"> | undefined;
    if (!company)
      return res
        .status(404)
        .json({ success: false, error: "Company not found" });

    const usage = db
      .prepare(
        `SELECT COUNT(*) as count FROM movie_companies WHERE company_id = ?`,
      )
      .get(id) as { count: number };
    if (usage.count > 0) {
      return res.status(409).json({
        success: false,
        error: "Cannot delete a company that is credited in movies",
        movie_count: usage.count,
      });
    }

    db.prepare(`DELETE FROM companies WHERE id = ?`).run(id);
    res.json({
      success: true,
      message: "Company deleted successfully",
      deletedCompany: company,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: "Failed to delete company",
      message: err.message,
    });
  }
});

export default router;
