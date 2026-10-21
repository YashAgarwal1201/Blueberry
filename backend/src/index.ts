// src/index.ts
import "dotenv/config";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { serve, getRequestListener } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import fs from "fs";
import https from "https";
import path from "path";
import { loggerMiddleware } from "./middleware/logger-middleware";

import moviesRouter from "./routes/movies";
import tvRouter from "./routes/tv";
import languagesRouter from "./routes/languages";
import watchlistRouter from "./routes/watchlist";
import genresRouter from "./routes/genres";
import peopleRouter from "./routes/people";
import companiesRouter from "./routes/companies";
import collectionsRouter from "./routes/collections";
import preferencesRouter from "./routes/preferences";
import ingestRouter from "./routes/ingest";
import searchRouter from "./routes/search";
import { auth } from "./auth";
import { requireAuth, requireModerator } from "./middleware/authMiddleware";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();
const PORT = process.env.PORT || 8100;

// Harmonize allowed origins from FRONTEND_URL, BETTER_AUTH_URL, and BETTER_AUTH_TRUSTED_ORIGINS
const envOrigins = [
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(url => url.trim()) : []),
  ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL.trim()] : []),
  ...(process.env.BETTER_AUTH_TRUSTED_ORIGINS ? process.env.BETTER_AUTH_TRUSTED_ORIGINS.split(',').map(url => url.trim()) : []),
];

const allowedOrigins = Array.from(new Set([
  ...envOrigins,
  'http://localhost:5130',
  'http://127.0.0.1:5130',
  'https://localhost:5130',
  'https://127.0.0.1:5130',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://localhost:5173',
  'https://127.0.0.1:5173',
  'http://localhost:80',
  'http://localhost',
]));

app.use(
  "*",
  cors({
    origin: (origin) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      // or if the origin is in our allowed list
      if (!origin || allowedOrigins.includes(origin)) {
        return origin || "*";
      }
      console.warn(`[CORS] Origin not allowed: ${origin}`);
      return null;
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  })
);

app.use("*", loggerMiddleware);

// Better Auth endpoint mounted directly over Web Standards
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Health check endpoint
app.get("/health", (c) => {
  const clientIp =
    c.req.header("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown";

  return c.json({
    status: "ok",
    message: "Server is healthy.",
    ip: clientIp,
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get("/", (c) => {
  return c.json({
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

// Routes
app.route("/movies", moviesRouter);
app.route("/tv", tvRouter);
app.route("/languages", languagesRouter);
app.use("/watchlist", requireAuth);
app.use("/watchlist/*", requireAuth);
app.route("/watchlist", watchlistRouter);
app.route("/genres", genresRouter);
app.route("/people", peopleRouter);
app.route("/companies", companiesRouter);
app.route("/collections", collectionsRouter);
app.use("/api/preferences", requireAuth);
app.use("/api/preferences/*", requireAuth);
app.route("/api/preferences", preferencesRouter);
app.use("/ingest", requireModerator);
app.use("/ingest/*", requireModerator);
app.route("/ingest", ingestRouter);
app.route("/search", searchRouter);

// Static files from public/
app.use("/*", serveStatic({ root: "./public" }));

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: "Route not found",
    path: c.req.path,
  }, 404);
});

// Start server
const certPath = path.join(process.cwd(), "certs", "localhost.pem");
const keyPath = path.join(process.cwd(), "certs", "localhost-key.pem");
const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

const listener = getRequestListener(app.fetch);
Object.assign(listener, app);

if (process.env.NODE_ENV !== 'test') {
  if (hasCerts) {
    const options = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    https.createServer(options, listener).listen(PORT, () => {
      console.log(`Server running securely on https://localhost:${PORT}`);
      console.log(`Database: SQLite (data/app.db)`);
      console.log(`Routes: /movies, /languages, /watchlist`);
    });
  } else {
    serve({ fetch: app.fetch, port: Number(PORT) }, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Database: SQLite (data/app.db)`);
      console.log(`Routes: /movies, /languages, /watchlist`);
    });
  }
}

export { app };
export default listener;
