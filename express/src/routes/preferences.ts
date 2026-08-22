import express, { Request, Response, Router } from "express";
import db from "../db";

const router: Router = express.Router();

const getPreferencesStmt = db.prepare(`SELECT preferences FROM "user" WHERE id = ?`);
const updatePreferencesStmt = db.prepare(`UPDATE "user" SET preferences = ? WHERE id = ?`);

router.get("/", (req: Request, res: Response): void => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const row = getPreferencesStmt.get(user.id) as { preferences: string | null } | undefined;
    
    if (!row) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    let prefs = {};
    if (row.preferences) {
      try {
        prefs = JSON.parse(row.preferences);
      } catch (e) {
        console.error("Failed to parse preferences JSON", e);
      }
    }

    res.json({ success: true, preferences: prefs });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    res.status(500).json({ error: "Failed to fetch preferences" });
  }
});

router.put("/", (req: Request, res: Response): void => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const newPreferences = req.body;
    if (typeof newPreferences !== "object" || newPreferences === null) {
      res.status(400).json({ error: "Invalid preferences object" });
      return;
    }

    const prefsStr = JSON.stringify(newPreferences);
    updatePreferencesStmt.run(prefsStr, user.id);

    res.json({ success: true, preferences: newPreferences });
  } catch (error) {
    console.error("Error updating preferences:", error);
    res.status(500).json({ error: "Failed to update preferences" });
  }
});

export default router;
