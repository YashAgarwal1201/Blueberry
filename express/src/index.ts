// const express = require("express");
// const { loggerMiddleware } = require("./middleware/logger-middleware");
// const itemsRouter = require("./routes/items");

// const app = express();
// const PORT = 8100;

// // Use the middleware for all incoming requests
// app.use(loggerMiddleware);

// app.use(express.json());
// app.use(express.static("public"));

// app.use("/items", itemsRouter);

// // Sample route
// app.get("/", (req, res) => {
//   // res.send('Welcome to Express CRUD learning!');
//   res.sendFile(__dirname + "/public/index.html");
// });

// // Placeholder for CRUD routes
// // TODO: Add create, read, update, delete endpoints

// app.post("/", (req, res) => {
//   // res.send('Welcome to Express CRUD learning!');
//   res.send("hellow ");
// });

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

import express, { Request, Response, Application } from "express";
import { loggerMiddleware } from "./middleware/logger-middleware";
import itemsRouter from "./routes/items";
import cors from "cors";

const app: Application = express();
const PORT: number = 8100;

// --- CORS FIX HERE ---
app.use(
  cors({
    origin: "http://localhost:5130", // your frontend URL
    credentials: true, // if you need to send cookies or auth headers
  })
);
// ---------------------

app.use(loggerMiddleware);

app.use(express.json());
app.use(express.static("public"));

app.use("/items", itemsRouter);

app.get("/", (req: Request, res: Response): void => {
  // res.send('Welcome to Express CRUD learning!');
  res.sendFile(__dirname + "/public/index.html");
});

app.post("/", (req: Request, res: Response): void => {
  res.send("Welcome to Blueberry Express BE!");
  // res.send("hello");
});

app.listen(PORT, (): void => {
  console.log(`Server running on http://localhost:${PORT}`);
});
