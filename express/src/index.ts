// src/index.ts
import express, { Request, Response, Application } from "express";
import cors from "cors";
import { loggerMiddleware } from "./middleware/logger-middleware";
import itemsRouter from "./routes/items";
import moviesRouter from "./routes/movies";
import languagesRouter from "./routes/languages";
import watchlistRouter from "./routes/watchlist";
import genresRouter from "./routes/genres";
import peopleRouter from "./routes/people";
import companiesRouter from "./routes/companies";
import collectionsRouter from "./routes/collections";

const app: Application = express();
const PORT = process.env.PORT || 8100;

app.use(
  cors({
    origin: "http://localhost:5130", // my frontend URL
    credentials: true, // if i need to send cookies or auth headers
  }),
);

app.use(loggerMiddleware);

// Middleware
// app.use(cors());
// app.use(loggerMiddleware);
app.use(express.json());
app.use(express.static("public"));

// Health check endpoint
// app.get("/health", (req: Request, res: Response) => {
//   res.json({ status: "ok", timestamp: new Date().toISOString() });
// });

app.get("/health", (req: Request, res: Response): void => {
  const clientIp =
    req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown";

  res.status(200).json({
    status: "ok",
    message: "Server is healthy.",
    ip: clientIp,
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/items", itemsRouter); // Keeping old routes
app.use("/movies", moviesRouter);
app.use("/languages", languagesRouter);
app.use("/watchlist", watchlistRouter);
app.use("/genres", genresRouter);
app.use("/people", peopleRouter);
app.use("/companies", companiesRouter);
app.use("/collections", collectionsRouter);

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Blueberry API",
    version: "2.0.0",
    endpoints: {
      movies: "/movies",
      languages: "/languages",
      watchlist: "/watchlist",
      genres: "/genres",
      people: "/people",
      companies: "/companies",
      collections: "/collections",
      health: "/health",
    },
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Database: SQLite (data/app.db)`);
  console.log(`Routes: /movies, /languages, /watchlist`);
});

export default app;
