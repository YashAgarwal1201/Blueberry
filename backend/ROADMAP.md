# Blueberry Backend — Roadmap & Checklist

Development is organized by feature categories.

---

## Foundation & Architecture
- [x] Scaffold Hono + TypeScript backend architecture
- [x] Configure Web Standards middleware (CORS, Request Logger, Better-Auth handler)
- [x] Multi-engine database abstraction via Drizzle ORM (`src/db/`)
- [x] Implement clean routing architecture (`src/routes/`)
- [x] Integrate shared types workspace (`../shared`)
- [x] Global rate-limiting capabilities for API security
- [x] Centralized error handling and typing utilities
- [ ] API Input Validation (e.g., using Zod for robust request payload checking)
- [x] Testing setup (Jest configured with 10 test suites and 53 passing tests)
- [x] Authoritative API Documentation & Technical Specification (`SPEC.md`)
- [x] Docker & Docker Compose setup for portable homelab and production self-hosting

## Authentication & Security
- [x] Better-Auth Web Standards integration mounted at `/api/auth/*`
- [x] Secure authentication endpoints (registration, login, sessions)
- [x] Implement protected routes middleware (`requireAuth`, `optionalAuth`)
- [x] Setup CORS allowing frontend origins (including HTTPS for local dev via mkcert)
- [ ] Email Service Integration (for password resets and magic links)
- [ ] Social Logins (Google, GitHub OAuth providers setup)
- [ ] Role-Based Access Control (RBAC) middleware (e.g., Admin vs User roles)

## Media & Data APIs
- [x] Route setup for Movies, TV Shows, and People
- [x] Filtering, sorting, and pagination for media endpoints
- [x] External API Integration (TMDB metadata and image ingestion)
- [x] In-memory TTL caching for hot watchlist queries & list Cache-Control headers
- [x] 100% of route queries ported to Drizzle ORM (Zero raw `better-sqlite3` statements in routes)
- [ ] Advanced Search API endpoints (handling complex queries)
- [ ] Personalized Recommendations Engine (Algorithm to suggest media based on user's watchlist)

## User Interactions & Custom Content
- [x] Watchlists API (CRUD operations for a user's watchlist with TV episode progress)
- [x] Custom Movies API (Endpoints to add and manage user-generated movies)
- [x] Custom Cast/People API (Endpoints to manage custom cast profiles)
- [x] Custom Collections API (Create, manage, and follow curated lists of media)
- [ ] Ratings & Reviews API (Store user reviews and calculate average ratings)

## AI Brain & Model Context Protocol (MCP)
- [ ] Model Context Protocol (MCP) Server (Generic tool endpoints over HTTP/SSE for AI orchestrators, Tulip, Claude Desktop, and agent clients)
- [ ] Header-based API Authentication (`X-User-Id` / `Authorization: Bearer <token>` / `X-API-Key`)

## Architectural Evolution: Express → Hono → Drizzle
- [x] Phase 1: Migrate Backend Framework from Express to Hono (preserve SQLite & existing business logic)
- [x] Phase 2: Ruthless Testing & Parity Verification (All 10 Jest test suites / 53 tests passing against Hono with SQLite)
- [x] Phase 3: Multi-Engine Database Abstraction via Drizzle ORM (Declare schemas, multi-engine adapter, port all queries)
- [x] Directory Rebrand: Rebrand workspace from `express/` to `backend/`
- [x] Self-Hosted Deployment: Docker Compose, multi-stage Dockerfiles, and Nginx reverse proxy
- [ ] Phase 4: Production Cloudflare Edge Deployment ($0/month on Pages & Workers)
- [ ] CI/CD pipeline setup (GitHub Actions for linting, testing, deploying)
