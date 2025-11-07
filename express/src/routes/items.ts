import express, { Request, Response, Router } from "express";
import db from "../db";

const router: Router = express.Router();

interface Item {
  id: number;
  title: string;
  description?: string;
}

interface ItemRequestBody {
  title?: string;
  description?: string;
}

// Prepared statements
const insertStmt = db.prepare(
  "INSERT INTO items (title, description) VALUES (?, ?)"
);

const selectAllStmt = db.prepare(
  "SELECT id, title, description FROM items ORDER BY id"
);

const selectByIdStmt = db.prepare(
  "SELECT id, title, description FROM items WHERE id = ?"
);

const updateStmt = db.prepare(
  "UPDATE items SET title = ?, description = ? WHERE id = ?"
);

const deleteStmt = db.prepare("DELETE FROM items WHERE id = ?");

// GET /items - Get all items
router.get("/", (req: Request, res: Response): void => {
  const data = selectAllStmt.all();
  res.json({ items: data });
});

// GET /items/:id - Get single item
router.get("/:id", (req: Request, res: Response): void => {
  const id = parseInt(req.params.id);
  const item = selectByIdStmt.get(id);

  if (!item) {
    res.status(404).json({ error: "Item not found." });
    return;
  }

  res.json(item);
});

// POST /items - Create new item
router.post(
  "/",
  (req: Request<{}, Item, ItemRequestBody>, res: Response): void => {
    const { title, description } = req.body;

    if (!title || title.trim() === "") {
      res.status(400).json({ error: "Title is required." });
      return;
    }

    const info = insertStmt.run(
      title.trim(),
      (description && description.length > 0
        ? description
        : "Description not available."
      )?.trim()
    );

    const created = selectByIdStmt.get(info.lastInsertRowid);
    res.status(201).json(created);
  }
);

// PATCH /items/:id - Update item
router.patch(
  "/:id",
  (
    req: Request<{ id: string }, Item | string, ItemRequestBody>,
    res: Response
  ): void => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const { title, description } = req.body;
    const existing: any = selectByIdStmt.get(id);

    if (!existing) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    const newTitle = title !== undefined ? title.trim() : existing.title;
    const newDesc =
      description !== undefined
        ? description.trim()
        : existing.description ?? "";

    if (!newTitle) {
      res.status(400).json({ error: "Title cannot be empty" });
      return;
    }

    updateStmt.run(newTitle, newDesc, id);
    const updated = selectByIdStmt.get(id);
    res.json(updated);
  }
);

// DELETE /items/:id - Delete item
router.delete("/:id", (req: Request<{ id: string }>, res: Response): void => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const existing = selectByIdStmt.get(id);
  if (!existing) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  deleteStmt.run(id);
  res.json(existing);
});

export default router;
