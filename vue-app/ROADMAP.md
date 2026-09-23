# Blueberry Vue App — Roadmap & Checklist

Development is organized by feature categories.

---

## Foundation & Architecture
- [x] Scaffold Vue 3 + TS + Vite project
- [x] Install core libraries (Tailwind, PrimeVue, Pinia, Vue Router, Better-Auth, Axios)
- [x] Set up folder structure (`src/components`, `src/views`, `src/stores`, `src/services`, etc.)
- [x] Configure Tailwind CSS v4
- [x] Set up base routing shell
- [x] Set up Pinia store structure
- [x] Integrate shared types workspace (`../shared`)
- [x] Configure ESLint and Prettier for code quality
- [x] Progressive Web App (PWA) support (offline support and installability)
- [ ] SEO Optimization (Server-Side Rendering / Static Site Generation)
- [x] Comprehensive Unit Testing suites (Vitest for frontend, Jest for backend)
- [ ] End-to-End (E2E) Testing (Playwright/Cypress)
- [ ] Performance Optimization (Lazy loading components, CDN image delivery)

## Authentication & User Accounts
- [x] User Registration and Login via Better-Auth
- [x] Password Recovery and Reset flows
- [x] User Profile management and Settings
- [x] State management for user sessions
- [ ] Social Logins (Google, GitHub, Apple)
- [ ] Two-Factor Authentication (2FA)
- [ ] Role-Based Access Control (Admin dashboards for moderating custom content/users)

## Media Discovery & Browsing
- [x] Browsing libraries for Movies, TV Shows, and People
- [x] Filtering content by Genres and Languages
- [x] Detailed pages for Movies and TV Shows (synopsis, cast, metadata)
- [x] Responsive side menu and navigation bar
- [ ] Advanced Search (Global search with autocomplete and complex filters e.g., year, rating)
- [ ] Personalized Recommendations (Based on user watchlists and history)
- [ ] Trending/Popular Feeds (Dedicated sections for currently trending content)
- [ ] Embedded video players for trailers and teasers

## User Interactions & Custom Content
- [x] Watchlists (Add/remove media to personal watchlist)
- [x] Custom Movies & People (Forms to add user-generated content)
- [x] Cast Editor (Dedicated UI to manage cast and crew for custom movies)
- [ ] Ratings & Reviews (Allow users to rate and write reviews for movies/shows)
- [ ] Custom Collections (Create, share, and follow user-generated lists like "Best Sci-Fi of 2020")
- [ ] Comments & Discussions (Community features for specific media or episodes)

## UI, UX & Design
- [x] Clean, modern aesthetic using Tailwind CSS
- [x] Rich component library integration (PrimeVue)
- [x] Responsive layouts with interactive components (Media Drawers, Hero Carousels)
- [ ] Theme Toggle (Full Dark Mode / Light Mode support with user preference saving)
- [ ] Internationalization (i18n) support
- [ ] Infinite Scrolling (Seamlessly load more content on list pages)
- [x] Micro-animations (Enhanced transition effects for page navigations and interactions)
