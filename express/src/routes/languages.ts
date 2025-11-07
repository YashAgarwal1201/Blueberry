// src/routes/languages.ts

import express, { Request, Response, Router } from "express";
import db from "../db";
import { Language } from "../types.ts";

const router: Router = express.Router();

// Prepared statements
const selectAllLanguagesStmt = db.prepare(`
  SELECT id, name, code FROM languages ORDER BY name ASC
`);

const selectLanguageByIdStmt = db.prepare(`
  SELECT id, name, code FROM languages WHERE id = ?
`);

const selectLanguageByCodeStmt = db.prepare(`
  SELECT id, name, code FROM languages WHERE code = ?
`);

const insertLanguageStmt = db.prepare(`
  INSERT INTO languages (name, code) VALUES (?, ?)
`);

const updateLanguageStmt = db.prepare(`
  UPDATE languages SET name = ?, code = ? WHERE id = ?
`);

const deleteLanguageStmt = db.prepare(`
  DELETE FROM languages WHERE id = ?
`);

const checkLanguageUsageStmt = db.prepare(`
  SELECT COUNT(*) as count FROM movie_languages WHERE language_id = ?
`);

// Simple in-memory cache for languages
class LanguageCache {
  private cache: Map<string, { data: Language[]; timestamp: number }> =
    new Map();
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  get(key: string): Language[] | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    return cached.data;
  }

  set(key: string, data: Language[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  invalidate(): void {
    this.cache.clear();
  }
}

const languageCache = new LanguageCache();

// GET /languages - Get all languages
router.get("/", (req: Request, res: Response) => {
  try {
    const { nocache } = req.query;

    // Try cache first
    if (!nocache) {
      const cached = languageCache.get("all");
      if (cached) {
        return res.json({
          success: true,
          count: cached.length,
          languages: cached,
          cached: true,
        });
      }
    }

    const languages = selectAllLanguagesStmt.all() as Language[];
    languageCache.set("all", languages);

    res.json({
      success: true,
      count: languages.length,
      languages,
      cached: false,
    });
  } catch (err: any) {
    console.error("Error fetching languages:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch languages",
      message: err.message,
    });
  }
});

// GET /languages/:id - Get a single language
router.get("/:id", (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid language ID",
      });
    }

    const language = selectLanguageByIdStmt.get(id) as Language | undefined;
    if (!language) {
      return res.status(404).json({
        success: false,
        error: "Language not found",
      });
    }

    res.json({
      success: true,
      language,
    });
  } catch (err: any) {
    console.error("Error fetching language:", err);
    res.status(500).json({
      success: false,
      error: "Failed to fetch language",
      message: err.message,
    });
  }
});

// POST /languages - Add a new language
router.post("/", (req: Request, res: Response) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        error: "Name and code are required",
      });
    }

    if (name.trim().length === 0 || code.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Name and code cannot be empty",
      });
    }

    // Validate code format (ISO 639-1/639-2: 2-3 lowercase letters)
    const codeRegex = /^[a-z]{2,3}$/;
    if (!codeRegex.test(code.trim())) {
      return res.status(400).json({
        success: false,
        error: "Code must be 2-3 lowercase letters (ISO 639-1/639-2)",
      });
    }

    // Check if code already exists
    const existing = selectLanguageByCodeStmt.get(code.trim()) as
      | Language
      | undefined;
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "Language code already exists",
        existing,
      });
    }

    const info = insertLanguageStmt.run(name.trim(), code.trim().toLowerCase());
    const languageId = info.lastInsertRowid as number;

    const language = selectLanguageByIdStmt.get(languageId) as Language;
    languageCache.invalidate();

    res.status(201).json({
      success: true,
      message: "Language added successfully",
      language,
    });
  } catch (err: any) {
    console.error("Error adding language:", err);
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({
        success: false,
        error: "Language name or code already exists",
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to add language",
      message: err.message,
    });
  }
});

// PUT /languages/:id - Update a language
router.put("/:id", (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid language ID",
      });
    }

    const existing = selectLanguageByIdStmt.get(id) as Language | undefined;
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Language not found",
      });
    }

    const { name, code } = req.body;
    const updatedName = name !== undefined ? name.trim() : existing.name;
    const updatedCode =
      code !== undefined ? code.trim().toLowerCase() : existing.code;

    if (updatedName.length === 0 || updatedCode.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Name and code cannot be empty",
      });
    }

    const codeRegex = /^[a-z]{2,3}$/;
    if (!codeRegex.test(updatedCode)) {
      return res.status(400).json({
        success: false,
        error: "Code must be 2-3 lowercase letters (ISO 639-1/639-2)",
      });
    }

    updateLanguageStmt.run(updatedName, updatedCode, id);
    const language = selectLanguageByIdStmt.get(id) as Language;
    languageCache.invalidate();

    res.json({
      success: true,
      message: "Language updated successfully",
      language,
    });
  } catch (err: any) {
    console.error("Error updating language:", err);
    if (err.message.includes("UNIQUE constraint failed")) {
      return res.status(409).json({
        success: false,
        error: "Language name or code already exists",
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to update language",
      message: err.message,
    });
  }
});

// DELETE /languages/:id - Delete a language
router.delete("/:id", (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid language ID",
      });
    }

    const language = selectLanguageByIdStmt.get(id) as Language | undefined;
    if (!language) {
      return res.status(404).json({
        success: false,
        error: "Language not found",
      });
    }

    // Check if language is used by any movies
    const usage = checkLanguageUsageStmt.get(id) as { count: number };
    if (usage.count > 0) {
      return res.status(409).json({
        success: false,
        error: "Cannot delete language that is used by movies",
        usedBy: usage.count,
      });
    }

    const info = deleteLanguageStmt.run(id);
    if (info.changes === 0) {
      return res.status(404).json({
        success: false,
        error: "Language not found",
      });
    }

    languageCache.invalidate();

    res.json({
      success: true,
      message: "Language deleted successfully",
      deletedLanguage: {
        id: language.id,
        name: language.name,
      },
    });
  } catch (err: any) {
    console.error("Error deleting language:", err);
    res.status(500).json({
      success: false,
      error: "Failed to delete language",
      message: err.message,
    });
  }
});

export default router;
