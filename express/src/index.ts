// src/index.ts
import express, { Request, Response, Application } from "express";
import fs from "fs";
import https from "https";
import path from "path";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { loggerMiddleware } from "./middleware/logger-middleware";
import itemsRouter from "./routes/items";
import moviesRouter from "./routes/movies";
import tvRouter from "./routes/tv";
import languagesRouter from "./routes/languages";
import watchlistRouter from "./routes/watchlist";
import genresRouter from "./routes/genres";
import peopleRouter from "./routes/people";
import companiesRouter from "./routes/companies";
import collectionsRouter from "./routes/collections";
import preferencesRouter from "./routes/preferences";
import { auth } from "./auth";
import { toNodeHandler } from "better-auth/node";
import { requireAuth } from "./middleware/authMiddleware";

const app: Application = express();
const PORT = process.env.PORT || 8100;

// Allow multiple origins by splitting the FRONTEND_URL environment variable by comma, or fallback to localhost
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : ['http://localhost:5130', 'http://127.0.0.1:5130', 'https://localhost:5130', 'https://127.0.0.1:5130', 'http://localhost:5173', 'http://127.0.0.1:5173', 'https://localhost:5173', 'https://127.0.0.1:5173'];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      // or if the origin is in our allowed list
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Origin not allowed: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // if i need to send cookies or auth headers
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.use(loggerMiddleware);

// Rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 requests per windowMs for auth routes
  message: "Too many authentication attempts from this IP, please try again after 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Better Auth requires raw request parsing (without express.json) for its own routes
app.use("/api/auth", authLimiter, toNodeHandler(auth));

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
app.use("/tv", tvRouter);
app.use("/languages", languagesRouter);
app.use("/watchlist", requireAuth, watchlistRouter);
app.use("/genres", genresRouter);
app.use("/people", peopleRouter);
app.use("/companies", companiesRouter);
app.use("/collections", collectionsRouter);
app.use("/api/preferences", requireAuth, preferencesRouter);

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
const certPath = path.join(process.cwd(), "certs", "localhost.pem");
const keyPath = path.join(process.cwd(), "certs", "localhost-key.pem");
const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

if (hasCerts) {
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
  https.createServer(options, app).listen(PORT, () => {
    console.log(`Server running securely on https://localhost:${PORT}`);
    console.log(`Database: SQLite (data/app.db)`);
    console.log(`Routes: /movies, /languages, /watchlist`);
  });
} else {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Database: SQLite (data/app.db)`);
    console.log(`Routes: /movies, /languages, /watchlist`);
  });
}

export default app;
