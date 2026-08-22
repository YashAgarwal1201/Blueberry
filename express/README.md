# Blueberry - Express Backend

A modern, robust Node.js and Express backend serving the Blueberry media ecosystem. It provides RESTful APIs for media discovery, user authentication, and managing user-generated content (like custom movies and watchlists).

## Features

- **Authentication API** — Secure user registration, login, and session management powered by [Better-Auth](https://better-auth.com/).
- **Media Proxy & Management** — Unified endpoints for fetching and managing movies, TV shows, and cast details.
- **Custom Content APIs** — Endpoints to create, read, update, and delete user-generated custom movies and cast profiles.
- **Watchlist API** — Protected routes for managing a user's personal watchlist.
- **Database** — SQLite via `better-sqlite3` for lightweight, fast data persistence.
- **TypeScript** — Strongly typed codebase for reliability and developer experience.

## Tech Stack

| Concern                   | Choice                                                             |
| ------------------------- | ------------------------------------------------------------------ |
| Framework                 | Express.js + TypeScript                                            |
| Database                  | SQLite (`better-sqlite3`)                                          |
| Authentication            | Better-Auth                                                        |
| Data Validation           | Zod (via Better-Auth plugins or custom middleware)                 |
| Rate Limiting             | `express-rate-limit`                                               |
| Linting/Formatting        | ESLint, Prettier                                                   |

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
src/
  middleware/    # Express middlewares (auth, logging, rate limiting)
  routes/        # API route definitions (movies, tv, auth, watchlist, etc.)
  db.ts          # SQLite database connection and schema initialization
  auth.ts        # Better-Auth configuration and integration
  index.ts       # Application entry point and server setup
```

## Client Integration

This backend is designed to work seamlessly with the [Blueberry Vue Client](../vue-app). Make sure the Vue client's environment variables point to this backend (usually `http://localhost:8100`).

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the detailed development plan and checklist.
