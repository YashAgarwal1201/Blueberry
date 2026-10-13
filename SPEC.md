# Specification Document: Blueberry Media Platform

Blueberry is a modern, responsive full-stack media platform for discovering, tracking, curating, and cataloging movies, TV shows, and cast metadata. It is built as a cloud-ready, self-hostable monorepo that delivers a cinematic web experience, robust multi-engine data persistence, and native interoperability with external AI orchestrators.

---

## 1. Core Architecture

### Monorepo Structure
The project is structured as a TypeScript monorepo comprising three core packages:
* **`vue-app/`**: Client frontend application built with Vue 3 and Vite.
* **`express/` (or `backend/`)**: REST API and orchestration backend built with **Hono** and TypeScript, operating universally across Node.js, Cloudflare Workers, and Vercel.
* **`shared/`**: Shared TypeScript types, data contracts, and parameter schemas consumed by both client and server.

```
Blueberry/
├── express/            # Backend API (Hono), DB Layer (Drizzle), Auth, MCP Server
├── vue-app/            # Vue 3 SPA, Pinia Stores, PrimeVue, Dexie.js, PWA
├── shared/             # Shared TypeScript models, contracts, and enums
├── data/               # Persistent media storage and SQLite database files
├── SPEC.md             # Authoritative technical architecture specification
└── README.md           # Developer onboarding & quickstart documentation
```

### Frontend Stack (`vue-app`)
* **Framework**: Vue 3 (Composition API, `<script setup lang="ts">`).
* **Styling**: Tailwind CSS v4 & scoped CSS with design token variables.
* **UI Component Library**: PrimeVue v4 (Aura theme) + `@primeuix/themes`.
* **Icons**: Lucide Vue Next (`lucide-vue-next`) for consistent SVG iconography.
* **State Management**: Pinia v3 for reactive modular client stores.
* **Routing**: Vue Router v4 with 100% route-level asynchronous chunking (`() => import(...)`).
* **Local Storage & Cache**: 
  * Dexie.js (IndexedDB wrapper) for client-side search history and recent queries.
  * LocalStorage for user preferences and theme toggles.
* **PWA**: Service Worker caching via `vite-plugin-pwa` for offline capability and installability.
* **Carousel / Carousels**: Swiper v14 for hardware-accelerated touch sliders.
* **Build System**: Vite v7 with custom Rollup `manualChunks` vendor splitting (`vue-core`, `ui-lib`, `swiper`, `lucide`).

### Backend Stack (`express` / `backend`)
* **Framework**: **Hono** (`hono`) — Modern, zero-dependency web framework built natively on Web Standards (`Request`, `Response`, `fetch`).
  * **Universal Multi-Runtime**: Runs on Cloudflare Workers / Pages Functions ($0/month edge), Vercel Serverless, and local Node.js / Docker via `@hono/node-server`.
  * **Native Streaming & SSE**: Built-in Server-Sent Events primitives powering the Model Context Protocol (MCP) server.
  * **End-to-End Type Safety**: Built-in RPC client (`hc`) allowing Vue to consume fully typed API endpoints without code generation.
* **Authentication**: Better-Auth v1 mounted natively over Web `Request`/`Response` (supporting email/password, password resets, magic links, admin roles).
* **Database & ORM**: **Drizzle ORM Multi-Engine Abstraction**, dynamically switching between Cloudflare D1, LibSQL (Turso), PostgreSQL (Neon/Supabase), and local SQLite via `DATABASE_URL`.
* **External Metadata Provider**: The Movie Database (TMDB) API integration for automated ingestion of posters, backdrops, cast, and episode stills.
* **Testing Suite**: Jest with TypeScript and Hono's native `app.request()` test runner for fast, mock-free integration testing.

---

## 2. Data Schema & Domain Models

All primary data models are strictly defined in `shared/index.ts` and mirrored in the database layer.

### 1. `movies`
Stores feature films, metadata, ratings, financial figures, and poster/backdrop references.
* `id` (INTEGER, Primary Key)
* `uuid` (TEXT, Unique UUID string)
* `title` (TEXT, Not Null)
* `tagline` (TEXT | null)
* `description` (TEXT | null)
* `status` (TEXT: `'released' | 'upcoming' | 'in_production' | 'cancelled'`)
* `release_year` (INTEGER | null)
* `runtime` (INTEGER | null, in minutes)
* `origin_country` (TEXT | null)
* `original_language` (TEXT | null)
* `age_rating` (TEXT | null, e.g. `PG-13`, `R`)
* `imdb_id` (TEXT | null, Unique)
* `tmdb_id` (INTEGER | null, Unique)
* `letterboxd_id` (TEXT | null)
* `wikidata_id` (TEXT | null)
* `rottentomatoes_id` (TEXT | null)
* `poster_url` (TEXT | null, custom/external URL)
* `backdrop_url` (TEXT | null, custom/external URL)
* `trailer_url` (TEXT | null)
* `budget` (INTEGER | null)
* `box_office` (INTEGER | null)
* `rating_imdb` (REAL | null)
* `rating_rt` (INTEGER | null, percentage)
* `rating_metacritic` (INTEGER | null)
* `tmdb_poster_path` (TEXT | null, e.g. `/path.jpg`)
* `tmdb_backdrop_path` (TEXT | null, e.g. `/path.jpg`)
* `tmdb_trailer_key` (TEXT | null, YouTube key)
* `local_poster_url` (TEXT | null)
* `local_backdrop_url` (TEXT | null)
* `image_source` (TEXT: `'tmdb' | 'local' | 'custom'`)
* `spoken_languages` (TEXT | null, JSON array)
* `production_countries` (TEXT | null, JSON array)
* `keywords` (TEXT | null, JSON array)
* `content_advisory` (TEXT | null)
* `created_at` (TEXT, ISO / datetime string)
* `updated_at` (TEXT, ISO / datetime string)

### 2. `tv_shows`
Series metadata, seasons, network, and broadcast runtimes.
* `id` (INTEGER, Primary Key)
* `uuid` (TEXT, Unique UUID string)
* `title` (TEXT, Not Null)
* `tagline` (TEXT | null)
* `description` (TEXT | null)
* `status` (TEXT: `'returning_series' | 'planned' | 'in_production' | 'ended' | 'canceled' | 'pilot'`)
* `first_air_date` (TEXT | null)
* `last_air_date` (TEXT | null)
* `network` (TEXT | null)
* `origin_country` (TEXT | null)
* `original_language` (TEXT | null)
* `age_rating` (TEXT | null)
* `imdb_id` (TEXT | null, Unique)
* `tmdb_id` (INTEGER | null, Unique)
* `letterboxd_id` (TEXT | null)
* `wikidata_id` (TEXT | null)
* `rating_imdb` (REAL | null)
* `rating_rt` (INTEGER | null)
* `rating_metacritic` (INTEGER | null)
* `episode_count` (INTEGER, Default: 0)
* `season_count` (INTEGER, Default: 0)
* `runtime_per_episode` (INTEGER | null)
* `budget` (INTEGER | null)
* `box_office` (INTEGER | null)
* `poster_url` (TEXT | null)
* `backdrop_url` (TEXT | null)
* `tmdb_poster_path` (TEXT | null)
* `tmdb_backdrop_path` (TEXT | null)
* `image_source` (TEXT: `'tmdb' | 'local' | 'custom'`)
* `keywords` (TEXT | null, JSON array)
* `created_at` (TEXT, ISO string)
* `updated_at` (TEXT, ISO string)

### 3. `tv_seasons` & `tv_episodes`
Hierarchical structure for episodic content.
* **`tv_seasons`**: `id`, `uuid`, `show_id` (FK $\rightarrow$ `tv_shows.id`), `season_number`, `title`, `overview`, `poster_url`, `tmdb_poster_path`, `episode_count`, `air_date`, `tmdb_id`.
* **`tv_episodes`**: `id`, `uuid`, `season_id` (FK $\rightarrow$ `tv_seasons.id`), `show_id` (FK $\rightarrow$ `tv_shows.id`), `episode_number`, `title`, `overview`, `air_date`, `runtime`, `still_url`, `tmdb_still_path`, `tmdb_id`, `imdb_id`.

### 4. `people` & `cast`
Actors, directors, writers, and crew linked to media items.
* **`people`**: `id`, `uuid`, `name`, `also_known_as`, `bio`, `birth_date`, `birth_place`, `death_date`, `gender`, `known_for_department`, `profile_url`, `tmdb_profile_path`, `local_profile_url`, `tmdb_id`, `imdb_id`, `wikidata_id`, `popularity`, `homepage`, `created_at`.
* **`movie_cast` / `tv_cast`**: `show_id` / `movie_id`, `person_id`, `role` (`'actor' | 'director' | 'writer' | 'producer' | 'cinematographer' | 'composer' | 'editor' | 'creator'`), `character`, `display_order`.

### 5. `watchlist`
Personal user watchlist tracking progress and status.
* `id` (INTEGER, Primary Key)
* `user_id` (TEXT, FK $\rightarrow$ Better-Auth `user.id`)
* `movie_id` (INTEGER | null, FK $\rightarrow$ `movies.id`)
* `show_id` (INTEGER | null, FK $\rightarrow$ `tv_shows.id`)
* `status` (TEXT: `'want_to_watch' | 'watching' | 'watched'`)
* `user_rating` (INTEGER | null, 1–10 scale)
* `liked` (INTEGER, Boolean flag 0/1)
* `notes` (TEXT | null)
* `review_text` (TEXT | null)
* `watch_count` (INTEGER, Default: 0)
* `last_watched_at` (TEXT | null)
* `source` (TEXT | null)
* `added_at` (TEXT, Timestamp)
* `updated_at` (TEXT, Timestamp)

### 6. `collections` & `collection_items`
User-curated thematic lists (e.g. "Best Sci-Fi of the 2010s").
* **`collections`**: `id`, `uuid`, `user_id`, `title`, `description`, `is_public`, `created_at`, `updated_at`.
* **`collection_items`**: `id`, `collection_id` (FK), `movie_id` (FK | null), `show_id` (FK | null), `display_order`, `notes`, `added_at`.

### 7. Taxonomies (`genres` & `languages`)
* **`genres`**: `id`, `name`, `slug` (Unique), `description`, `created_at`.
* **`languages`**: `id`, `name`, `code` (Unique 2-letter ISO), `native_script`.

---

## 3. Database Architecture & Multi-Engine Abstraction

To support both **frictionless local self-hosting** and **scalable cloud deployments**, Blueberry abstracts the database engine behind a unified TypeScript layer (Drizzle ORM).

### Supported Engine Tiers
```
┌────────────────────────────────────────────────────────────────────────┐
│                        BLUEBERRY DATABASE LAYER                        │
├────────────────────────────────────────────────────────────────────────┤
│                       Multi-Engine Abstraction                         │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 1. Local SQLite   │ 2. Turso (LibSQL) │ 3. PostgreSQL                  │
│    (Default)      │    (Edge SQLite)  │    (Neon / Supabase / RDS)     │
├───────────────────┼───────────────────┼────────────────────────────────┤
│ • Zero config     │ • Serverless edge │ • Enterprise homelabs          │
│ • Docker volumes  │ • Global replicas │ • Neon / Supabase cloud        │
│ • Embedded files  │ • HTTP connection │ • Connection pooling           │
└───────────────────┴───────────────────┴────────────────────────────────┘
```

1. **Local SQLite (Default)**:
   * Connection: `DATABASE_URL="file:./blueberry.db"`
   * Driver: `better-sqlite3`
   * Target: Community self-hosters, local development, single-node Docker containers.
2. **LibSQL / Turso**:
   * Connection: `DATABASE_URL="libsql://your-db.turso.io"`, `DATABASE_AUTH_TOKEN="..."`
   * Driver: `@libsql/client`
   * Target: Serverless deployments requiring globally replicated SQLite with zero state on the host server.
3. **PostgreSQL (Neon, Supabase, Local Docker Postgres)**:
   * Connection: `DATABASE_URL="postgres://user:pass@host/db"`
   * Driver: `postgres-js` or `@neondatabase/serverless`
   * Target: Dedicated production deployments and homelab users with existing Postgres clusters.

### Database Query Invariants
1. **Explicit Column Projections on List Queries**: `SELECT *` is strictly prohibited on list endpoints (`/movies`, `/tv/recent`, `/tv/top-rated`, etc.). Queries must only request columns required for `MediaCard` serialization (`TV_CARD_COLUMNS`, `MOVIE_CARD_COLUMNS`). Heavy text blobs (`description`, `keywords`, `content_advisory`) are restricted to detail routes (`/tv/:uuid`, `/movies/:uuid`).
2. **B-Tree Indexes**: Any column participating in `ORDER BY` or `WHERE` list filters must possess an active index (e.g. `idx_movies_rating_imdb`, `idx_movies_release_year`, `idx_tv_air_date`, `idx_tv_status`).
3. **In-Memory TTL Caching for Hot Queries**: High-frequency lookups (like `getWatchlistSet()`) use a 5-second in-memory TTL cache with immediate cache invalidation on write mutations.

---

## 4. Deployment Architecture & Environment Permutations

Blueberry is engineered to be **infrastructure-agnostic**. Rather than imposing a single deployment model, the application decouples compute, database, and asset delivery so that developers and self-hosters can mix and match any permutation based on their requirements:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   COMPOSABLE INFRASTRUCTURE MATRIX                     │
├──────────────────────┬────────────────────────┬────────────────────────┤
│ Compute Runtime      │ Database Engine        │ Edge & Asset Delivery  │
├──────────────────────┼────────────────────────┼────────────────────────┤
│ • Unified Container  │ • Embedded SQLite file │ • Direct Origin (None) │
│ • Decoupled SPA+API  │ • LibSQL / Turso       │ • Custom Edge CDN      │
│ • Bare-metal / VPS   │ • PostgreSQL (Docker,  │ • Image Resizing Proxy │
│ • Cloud / PaaS       │   Neon, Supabase, RDS) │ • Homelab Reverse Proxy│
└──────────────────────┴────────────────────────┴────────────────────────┘
```

### 1. Compute Runtime Permutations
* **Cloudflare Workers / Pages Functions ($0/Month Edge)**: Hono compiles directly into a native Cloudflare Worker / Pages Function running at the edge. The Vue SPA is hosted on Cloudflare Pages, providing an entire full-stack deployment for $0/month.
* **Vercel Serverless ($0/Month)**: Hono runs natively on Vercel's Node/Edge functions, with the Vue SPA served on Vercel's global CDN.
* **Unified Process (Single Port for Self-Hosters)**: In local development or Docker, Hono (via `@hono/node-server`) serves both the REST API endpoints and statically serves the compiled Vue client (`vue-app/dist`). This allows the entire platform to run in a single container or single process on a single port.
* **Containerized Deployment**: Packaged via Docker / Docker Compose / Kubernetes for homelab self-hosters with persistent volume mounts for local SQLite/data.
* **Bare-Metal / Traditional VPS**: Run as standard Node.js services managed by process managers (`systemd`, `PM2`, `supervisord`).

### 2. Database Engine Independence
Database selection is 100% decoupled from the compute runtime and controlled via `DATABASE_URL`:
* Any deployment runtime can connect to **any** supported database (e.g. Docker container using Neon Postgres, or bare-metal VPS using local SQLite, or cloud container using Turso).

### 3. Ingress & Reverse Proxy Flexibility
The application makes no assumptions about the upstream proxy or domain layer:
* **Homelabs / Self-Hosting**: Can sit behind Nginx, Caddy, Traefik, or reverse proxies with local SSL certificates.
* **Cloud / Managed Hosting**: Can sit behind global edge CDNs (Cloudflare, AWS CloudFront, Fastly, BunnyCDN) for DDoS mitigation, edge caching, and SSL termination.
* **Direct Access**: Can run with direct IP/port exposure for internal network access.

---

## 5. Image & Asset Delivery Pipeline

### Image Resolution Architecture
To guarantee database portability and prevent vendor lock-in, **hardcoded CDN domain URLs are never stored in database records.**

```
┌─────────────────────────────────┬────────────────────────────────────────────────────────┐
│ Database Field                  │ What is Stored (Canonical / Relative Only)             │
├─────────────────────────────────┼────────────────────────────────────────────────────────┤
│ `tmdb_poster_path`              │ `/ggFHVNu6YYI5LidFZRvIyM1xo29.jpg` (TMDB relative path)│
│ `local_poster_url`              │ `/uploads/posters/movie-123.webp` (Relative path)      │
│ `poster_url`                    │ `https://example.com/poster.jpg` (Custom external URL) │
└─────────────────────────────────┴────────────────────────────────────────────────────────┘
```

### Runtime Resolution Rules (`imageUtils.ts`):
Asset delivery is dynamic and provider-agnostic, governed by the `VITE_CDN_URL` environment variable:

* **Mode 1: Direct Origin Delivery (`VITE_CDN_URL=""` — Default)**:
  * Zero external accounts or cloud services required.
  * TMDB images resolve directly to TMDB's public edge: `https://image.tmdb.org/t/p/{size}{path}`.
  * Custom image URLs load directly from their source host.
* **Mode 2: Configured CDN / Image Transformation Proxy (`VITE_CDN_URL="https://..."`)**:
  * The configured CDN prefix is prepended to image paths.
  * Compatible with any edge proxy (e.g. Cloudflare, AWS CloudFront, BunnyCDN, self-hosted Imgproxy, or `wsrv.nl`) for automatic WebP/AVIF format conversion, responsive downscaling, and edge caching.

### Size Presets
All image requests must pass a standard size preset to eliminate oversized asset downloads:
* `'sm' / 'w185'`: Small media carousel cards, cast avatars, grid search thumbnails.
* `'md' / 'w500'`: Standard poster cards on Movies and TV index pages.
* `'lg' / 'w780'`: Main poster art on movie and show detail pages.
* `'original'`: Hero backdrop banners.

### Component-Level Image Optimization (`AppImage.vue`)
* Native `loading="lazy"` on all images below the fold.
* Native `decoding="async"` to prevent UI main-thread blocking during decoding.
* CSS pulse shimmer skeleton placeholder until `onload` fires, eliminating Cumulative Layout Shift (CLS).

---

## 6. Native Model Context Protocol (MCP) Server

Blueberry exposes a native **Model Context Protocol (MCP)** server, providing a standardized, secure interface for external AI orchestrators and agent workflows to interact with Blueberry's catalog and user data.

```
┌─────────────────────────┐               Headers: X-API-Key / X-User-Id            ┌────────────────────────┐
│   ANY MCP-COMPATIBLE    │  ───────────────────────────────────────────────────►  │   BLUEBERRY API (HONO) │
│   AI CLIENT / AGENT     │                                                        │       /api/mcp         │
│ (Tulip, Claude, Cursor) │  ◄───────────────────────────────────────────────────  │                        │
└─────────────────────────┘            Token-efficient JSON Tool Results           └───────────┬────────────┘
                                                                                               │
                                                                                               ▼
                                                                                       ┌────────────────┐
                                                                                       │ Database Layer │
                                                                                       │ (Drizzle ORM)  │
                                                                                       └────────────────┘
```

### Consumer Agnostic Design
While originally conceived to empower dedicated personal AI brains (such as the author's **Tulip** orchestrator), the interface conforms to the open MCP specification and is completely consumer-agnostic:
* **Custom AI Brains & Orchestrators** (e.g. Tulip).
* **Desktop AI Clients** (Claude Desktop, Cursor, Goose, Continue).
* **Agent Frameworks & Bots** (LangChain, AutoGen, CrewAI, custom tool-calling agents).

### Protocol & Transport
* **Endpoint**: `POST /api/mcp` and `GET /api/mcp/sse`
* **Transport**: Server-Sent Events (SSE) and JSON-RPC 2.0 complying with the Model Context Protocol specification.
* **Authentication**: Authorized headers:
  * `Authorization: Bearer <user_token>` or `X-API-Key: <key>`
  * `X-User-Id: <user_id>` (optional, scopes queries to a specific user context).

### Exposed MCP Tools
1. `search_media(query, type?, genre?)`: Executes indexed searches across movies, TV series, and people.
2. `get_media_details(type, id_or_uuid)`: Returns full metadata, cast list, synopsis, ratings, and runtime for a title.
3. `get_watchlist(userId, status?, mediaType?)`: Retrieves a user's active, completed, or planned watchlists.
4. `add_to_watchlist(userId, mediaId, type, status)`: Allows the AI agent to append titles to the user's watchlist upon natural language commands.
5. `remove_from_watchlist(userId, mediaId, type)`: Removes an item from the user's watchlist.
6. `get_collections(userId?)`: Returns curated lists created by the user.
7. `log_watched_episode(userId, showId, seasonNumber, episodeNumber)`: Marks specific episodes as watched.

### Decoupled Presentation Philosophy
* The MCP server outputs **compact, token-efficient JSON**.
* AI agents reason over structured data; the consuming client renders its own native preview cards or summaries.
* Micro-Frontends (MFE) / Module Federation are intentionally excluded from this interface to avoid CSS conflicts and framework lock-in.

---

## 7. Authentication & Security Model

### Better-Auth Architecture
* **Provider**: Better-Auth mounted at `/api/auth/*`.
* **Session Storage**: Database-backed sessions stored in the `session` table with automatic TTL expiration.
* **Client Handlers**: Vue client uses `@better-fetch/fetch` and Better-Auth client library.
* **Security Controls**:
  * Passwords hashed via Argon2id / Scrypt.
  * Strict CORS origin validation matching active frontend ports.
  * Global rate limiting on sensitive auth endpoints (`/api/auth/*`, `/login`, `/register`).
  * Admin role plugin enabling moderation routes.

---

## 8. Client Storage & Search Indexing (Dexie.js)

### IndexedDB Schema (`blueberry_db`)
IndexedDB is managed on the client using **Dexie.js** for rapid, offline-capable local search caching.

```typescript
db.version(1).stores({
  search_history: '++id, query, timestamp, media_type',
  cached_queries: 'query, results, cached_at'
});
```

* **`search_history`**: Stores recent searches executed by the user in the global search drawer.
* **Auto-Pruning**: Search history is capped at the 50 most recent unique queries.

---

## 9. Performance Standards & Architectural Guardrails

For all future development and AI-assisted pair programming, the following rules are non-negotiable:

| Category | Invariant Rule |
| :--- | :--- |
| **TypeScript Discipline** | **Zero `any` tolerance.** All data structures must use named types from `shared/` or typed `unknown` with runtime type-guards. |
| **SQL Queries** | **No `SELECT *` on list queries.** Always project explicit column sets. `SELECT *` is only permitted for single-record detail lookups. |
| **Store Reactivity** | **Isolated loading states.** Every asynchronous Pinia store action must maintain its own dedicated `loadingX` ref (e.g. `loadingRecent`, `loadingTopRated`). Never share one loading flag across concurrent fetches. |
| **Image Resolution** | **No hardcoded CDN domains in database.** Use `resolveImageUrl` at runtime. All `<img>` tags must include `loading="lazy"` and `decoding="async"`. |
| **Vue Template Formatting** | **No multiline ternaries in template interpolations.** Always extract multiline conditions or complex strings into `<script setup>` `computed()` properties to prevent prettier/linter string-wrap syntax errors. |
| **Build Stability** | `npm run build` must cleanly exit 0 with zero TypeScript errors across all monorepo packages at all times. |
