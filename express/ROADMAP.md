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
- [ ] Centralized Error Handling middleware
- [ ] API Input Validation (e.g., using Zod for robust request payload checking)
- [ ] Testing setup (Jest/Mocha for unit testing routes and logic)
- [ ] API Documentation

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
- [x] External API Integration (if proxying external metadata services like TMDB)
- [ ] Caching layer for external API responses (Redis or in-memory cache)
- [ ] Advanced Search API endpoints (handling complex queries)
- [ ] Personalized Recommendations Engine (Algorithm to suggest media based on user's watchlist)

## User Interactions & Custom Content
- [x] Watchlists API (CRUD operations for a user's watchlist)
- [x] Custom Movies API (Endpoints to add and manage user-generated movies)
- [x] Custom Cast/People API (Endpoints to manage custom cast profiles)
- [ ] Ratings & Reviews API (Store user reviews and calculate average ratings)
- [ ] Custom Collections API (Create and follow curated lists of media)

## Deployment & Optimization
- [ ] Dockerize the Express application
- [ ] Migrate SQLite to a scalable database (e.g., PostgreSQL via Prisma or Drizzle) for production
- [ ] CI/CD pipeline setup (GitHub Actions for linting, testing, deploying)
- [ ] Performance monitoring and logging (e.g., Sentry, Winston with log rotation)
