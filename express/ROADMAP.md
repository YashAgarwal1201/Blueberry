# Blueberry Express App — Roadmap & Checklist

Development is organized by feature categories.

---

## Foundation & Architecture
- [x] Scaffold Express.js + TypeScript project
- [x] Configure basic middleware (CORS, Express JSON, Logging)
- [x] Set up local SQLite database connection using `better-sqlite3`
- [x] Implement routing architecture (`src/routes/`)
- [x] Integrate shared types workspace (`../shared`)
- [x] Add rate-limiting capabilities for API security
- [x] Centralized Error Handling middleware
- [ ] API Input Validation (e.g., using Zod for robust request payload checking)
- [x] Testing setup (Jest configured with 10 test suites and 53 passing tests)
- [x] API Documentation & Technical Specification (`SPEC.md`)

## Authentication & Security
- [x] Set up Better-Auth integration (`src/auth.ts`)
- [x] Configure authentication endpoints (`/api/auth`)
- [x] Implement protected routes middleware (`requireAuth`)
- [x] Setup CORS allowing frontend origins (including HTTPS for local dev via mkcert)
- [ ] Email Service Integration (for password resets and magic links)
- [ ] Social Logins (Google, GitHub OAuth providers setup)
- [ ] Role-Based Access Control (RBAC) middleware (e.g., Admin vs User roles)

## Media & Data APIs
- [x] Route setup for Movies, TV Shows, and People
- [x] Filtering and pagination for media endpoints
- [x] External API Integration (TMDB metadata and image ingestion)
- [x] In-memory TTL caching for hot watchlist queries & list Cache-Control headers
- [ ] Advanced Search API endpoints (handling complex queries)
- [ ] Personalized Recommendations Engine (Algorithm to suggest media based on user's watchlist)

## User Interactions & Custom Content
- [x] Watchlists API (CRUD operations for a user's watchlist)
- [x] Custom Movies API (Endpoints to add and manage user-generated movies)
- [x] Custom Cast/People API (Endpoints to manage custom cast profiles)
- [ ] Ratings & Reviews API (Store user reviews and calculate average ratings)
- [x] Custom Collections API (Create, manage, and follow curated lists of media)

## AI Brain & Model Context Protocol (MCP)
- [ ] Model Context Protocol (MCP) Server (Generic tool endpoints over HTTP/SSE for AI orchestrators, Tulip, Claude Desktop, and agent clients)
- [ ] Header-based API Authentication (`X-User-Id` / `Authorization: Bearer <token>` / `X-API-Key`)

## Architectural Evolution: Express → Hono → Drizzle
- [ ] Phase 1: Migrate Backend Framework from Express to Hono (preserve SQLite & existing business logic)
- [ ] Phase 2: Ruthless Testing & Parity Verification (All 10 Jest test suites / 53 tests passing against Hono with SQLite)
- [ ] Phase 3: Multi-Engine Database Abstraction via Drizzle ORM (Validate on SQLite first, then enable Cloudflare D1, Turso, Neon/Supabase)
- [ ] Phase 4: Production Cloudflare Edge Deployment ($0/month on Pages & Workers)
- [ ] Docker Compose configuration for portable local/homelab self-hosting
- [ ] CI/CD pipeline setup (GitHub Actions for linting, testing, deploying)
