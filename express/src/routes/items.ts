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

// prepared statements for speed + safety
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

// let items: Item[] = [
//   { id: 1, title: "Avengers", description: "Superhero team saves the world." },
//   { id: 2, title: "Jumanji", description: "Adventurous board game gone wild." },
// ];

// let nextId = 3;

// Helper to parse ID safely
// const getItemById = (req: Request): Item | undefined => {
//   const id = parseInt(req.params.id);
//   return items.find((i) => i.id === id);
// };

// GET all items (READ)
router.get("/", (req: Request, res: Response): void => {
  const data = selectAllStmt.all();
  res.json({ items: data });
});

// GET single item (READ)
router.get("/:id", (req: Request, res: Response): void => {
  const id = parseInt(req.params.id);

  const item = selectByIdStmt.get(id);
  // const item = getItemById(req);
  if (!item) {
    res.status(404).json({ error: "Item not found." });
    return;
  }
  res.json(item);
});

// POST new item (CREATE)
router.post(
  "/",
  (req: Request<{}, Item, ItemRequestBody>, res: Response): void => {
    const { title, description } = req.body;

    if (!title || title.trim() === "") {
      res.status(400).json({ error: "Title is required." });
      return;
    }

    // const newItem: Item = {
    //   id: nextId++,
    //   title: title.trim(),
    //   description: description?.trim() || "",
    // };

    // items.push(newItem);

    const info = insertStmt.run(title.trim(), (description ?? "").trim());
    const created = selectByIdStmt.get(info.lastInsertRowid);
    res.status(201).json(created);
  }
);

// PATCH update (partial UPDATE)
router.patch(
  "/:id",
  (
    req: Request<{ id: string }, Item | string, ItemRequestBody>,
    res: Response
  ): void => {
    // const item = getItemById(req);
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    // if (!item) {
    //   res.status(404).json({ error: "Item not found." });
    //   return;
    // }

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

// DELETE (REMOVE)
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
