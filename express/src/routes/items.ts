import express, { Request, Response, Router } from "express";

const router: Router = express.Router();

interface Item {
  id: number;
  name: string;
}

interface ItemRequestBody {
  name: string;
}

let items: Item[] = [
  { id: 1, name: "Item 1" },
  { id: 2, name: "Item 2" },
];

let nextId: number = 3;

// GET all items (READ)
router.get("/", (req: Request, res: Response): void => {
  res.json(items);
});

// GET a single item by ID (READ)
router.get("/:id", (req: Request, res: Response): void => {
  const item: Item | undefined = items.find(
    (i) => i.id === parseInt(req.params.id)
  );
  if (!item) {
    res.status(404).send("Item not found.");
    return;
  }
  res.json(item);
});

// POST a new item (CREATE)
router.post(
  "/",
  (
    req: Request<{}, Item, ItemRequestBody>,
    res: Response<Item | string>
  ): void => {
    const { name } = req.body;

    if (!name) {
      res.status(400).send("Name is required.");
      return;
    }

    const newItem: Item = {
      id: nextId++,
      name: name,
    };

    items.push(newItem);
    res.status(201).json(newItem);
  }
);

// PUT update an item by ID (UPDATE)
router.put(
  "/:id",
  (
    req: Request<{ id: string }, Item | string, ItemRequestBody>,
    res: Response<Item | string>
  ): void => {
    const item: Item | undefined = items.find(
      (i) => i.id === parseInt(req.params.id)
    );
    if (!item) {
      res.status(404).send("Item not found.");
      return;
    }

    const { name } = req.body;
    if (!name) {
      res.status(400).send("Name is required.");
      return;
    }

    item.name = name;
    res.json(item);
  }
);

// DELETE an item by ID (DELETE)
router.delete(
  "/:id",
  (req: Request<{ id: string }>, res: Response<Item | string>): void => {
    const itemIndex: number = items.findIndex(
      (i) => i.id === parseInt(req.params.id)
    );
    if (itemIndex === -1) {
      res.status(404).send("Item not found.");
      return;
    }

    const deletedItem: Item[] = items.splice(itemIndex, 1);
    res.json(deletedItem[0]);
  }
);

export default router;
