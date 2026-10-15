# Blueberry - Backend API

A modern, robust Hono and Drizzle ORM backend serving the Blueberry media ecosystem. It provides universal, lightweight RESTful APIs for media discovery, user authentication, and managing user-generated content (like custom collections, movies, and watchlists).

## Features

- **Authentication API** — Secure user registration, login, and session management powered by [Better-Auth](https://better-auth.com/).
- **Media Proxy & Management** — Unified endpoints for fetching and managing movies, TV shows, and cast details.
- **Custom Content APIs** — Endpoints to create, read, update, and delete user-generated custom movies, TV shows, and collections.
- **Watchlist & Collections API** — Protected routes for managing personal collections and watchlists.
- **Multi-Engine Database Layer** — Drizzle ORM for portable, type-safe data persistence across SQLite and PostgreSQL.
- **TypeScript** — Strongly typed codebase for reliability and developer experience.

## Tech Stack

| Concern                   | Choice                                                             |
| ------------------------- | ------------------------------------------------------------------ |
| Framework                 | Hono + TypeScript                                                  |
| ORM / Query Builder       | Drizzle ORM (`drizzle-orm`, `drizzle-kit`)                         |
| Database Driver           | SQLite (`better-sqlite3`, D1/Turso compatible) & Postgres           |
| Authentication            | Better-Auth                                                        |
| Server Runtime            | Node.js (`@hono/node-server`), edge portable                       |

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Copy the example environment file to `.env` and configure it if required:
   ```bash
   cp .env.example .env
   ```

3. **Setup local HTTPS (Recommended for secure development)**
   Like the frontend, this backend supports HTTPS out-of-the-box. Generate `mkcert` certificates in the `certs/` directory:
   ```bash
   mkdir -p certs
   cd certs
   mkcert -install
   mkcert localhost
   cd ..
   ```

4. **Run the dev server**
   ```bash
   npm run dev
   ```
   The server will start on `https://localhost:8100` (or `http://localhost:8100` if you skipped the HTTPS setup, or another port specified in your environment).

4. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

```
backend/
├── src/
│   ├── db/
│   │   ├── client.ts         # Multi-engine Drizzle adapter (SQLite, D1, LibSQL, Postgres)
│   │   └── schema/           # Drizzle table schemas & relations (auth, media, taxonomy, credits, userContent)
│   ├── middleware/           # Hono middlewares (Better-Auth handler, logger)
│   ├── plugins/              # Ingestion engine & external providers (TMDB, Wikidata, CSV)
│   ├── routes/               # Hono REST endpoints (movies, tv, watchlist, collections, etc.)
│   ├── utils/                # Helpers (image resolution, cache, errors, preferences)
│   ├── auth.ts               # Better-Auth server configuration
│   ├── db.ts                 # Hybrid database bridge exposing Drizzle ORM and tables
│   ├── index.ts              # Hono application entrypoint and server runner
│   └── types.ts              # Backend environment and context typing
├── tests/                    # Jest integration test suites
├── drizzle.config.ts         # Drizzle Kit migration and studio configuration
├── Dockerfile                # Multi-stage production container definition
└── package.json
```

## Docker & Self-Hosting

You can run the backend as part of the full stack using the root Docker Compose setup:

```bash
# In the repository root
docker compose up -d backend
```

## Client Integration

This backend is designed to work seamlessly with the [Blueberry Vue Client](../vue-app). Make sure the Vue client's environment variables point to this backend (usually `http://localhost:8100` or via reverse proxy).

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the detailed development plan and checklist.
