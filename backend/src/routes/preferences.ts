import { Hono } from "hono";
import db, { user as userTable } from "../db";
import { eq } from "drizzle-orm";
import type { AppEnv } from "../types";

const router = new Hono<AppEnv>();

router.get("/", (c) => {
  try {
    const authUser = c.get("user");
    if (!authUser) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const row = db
      .select({ preferences: userTable.preferences })
      .from(userTable)
      .where(eq(userTable.id, authUser.id))
      .get();
    
    if (!row) {
      return c.json({ error: "User not found" }, 404);
    }

    let prefs = {};
    if (row.preferences) {
      try {
        prefs = JSON.parse(row.preferences);
      } catch (e) {
        console.error("Failed to parse preferences JSON", e);
      }
    }

    return c.json({ success: true, preferences: prefs });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return c.json({ error: "Failed to fetch preferences" }, 500);
  }
});

router.put("/", async (c) => {
  try {
    const authUser = c.get("user");
    if (!authUser) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    let newPreferences: unknown;
    try {
      newPreferences = await c.req.json();
    } catch {
      return c.json({ error: "Invalid preferences object" }, 400);
    }

    if (typeof newPreferences !== "object" || newPreferences === null || Array.isArray(newPreferences)) {
      return c.json({ error: "Invalid preferences object" }, 400);
    }

    const prefsStr = JSON.stringify(newPreferences);
    db.update(userTable)
      .set({ preferences: prefsStr })
      .where(eq(userTable.id, authUser.id))
      .run();

    return c.json({ success: true, preferences: newPreferences });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return c.json({ error: "Failed to update preferences" }, 500);
  }
});

export default router;
