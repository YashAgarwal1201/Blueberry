# Blueberry

Blueberry is a modern, responsive web application for discovering, managing, and curating movies, TV shows, and cast details. The project is structured as a full-stack monorepo featuring a Vue 3 frontend and a high-performance Hono & Drizzle ORM backend.

## Project Structure

This monorepo consists of three main packages:

- **[`vue-app/`](./vue-app/)**: The frontend client built with Vue 3, Vite, Pinia, and Tailwind CSS.
- **[`backend/`](./backend/)**: The backend REST API built with Hono, Drizzle ORM, TypeScript, and multi-engine SQLite/Postgres.
- **[`shared/`](./shared/)**: Shared TypeScript types and interfaces used by both the frontend and backend to ensure end-to-end type safety.

## Features

- **Authentication** — Secure user registration, login, password recovery, and profile management (powered by [Better-Auth](https://better-auth.com/)).
- **Media Discovery** — Browse, filter, and discover movies, TV shows, and people with rich, detailed metadata pages.
- **Custom Content Forms** — Client-side forms to add user-generated movies and cast members, including a dedicated cast editor UI.
- **Watchlist Management** — UI to keep track of content you want to see by managing a personal watchlist.
- **Responsive UX** — Shared UI patterns across desktop and mobile devices featuring media drawers, hero carousels, and side menus.
- **Multi-Engine Database & ORM** — Portably typed via Drizzle ORM supporting SQLite (`better-sqlite3`, Cloudflare D1, Turso) and Postgres with clean relational schema definitions.

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v20+ recommended) and `npm` installed.

### Setup

1. **Install Dependencies**
   Navigate to both the frontend and backend directories to install their respective dependencies:
   ```bash
   cd backend && npm install
   cd ../vue-app && npm install
   cd ../shared && npm install
   ```

2. **Environment Variables**
   Set up your environment variables for both packages by copying the example files:
   ```bash
   cp backend/.env.example backend/.env
   cp vue-app/.env.example vue-app/.env
   ```

3. **HTTPS Certificates (Recommended)**
   Both the frontend and backend are configured to run locally via HTTPS. Use [`mkcert`](https://github.com/FiloSottile/mkcert) to generate the necessary local certificates.
   
   Generate certs in both directories:
   ```bash
   # Backend Certs
   mkdir -p backend/certs
   cd backend/certs
   mkcert -install
   mkcert localhost
   cd ../..

   # Frontend Certs
   mkdir -p vue-app/certs
   cd vue-app/certs
   mkcert -install
   mkcert localhost
   cd ../..
   ```

### Running the App Locally

To start the development environment, run the dev servers in separate terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd vue-app
npm run dev
```

- The API will be available at `https://localhost:8100`
- The Vue app will be available at `https://localhost:5130`

### Self-Hosting with Docker Compose

For homelabs and production self-hosting:

```bash
# 1. Copy the example environment file
cp .env.docker.example .env

# 2. Build and launch all containers
docker compose up -d
```

- Frontend SPA: `http://localhost:5130`
- Backend API & Health: `http://localhost:8100/health`
- Persistent SQLite database stored in Docker volume `blueberry_data`.

## Documentation & Roadmap

- **[Technical Architecture & Specification (`SPEC.md`)](./SPEC.md)**: Authoritative architecture, data schemas, dual-deployment model, multi-engine DB abstraction, and Tulip MCP protocol.
- **[Backend Roadmap](./backend/ROADMAP.md)**: Backend milestone tracker.
- **[Vue Client Roadmap](./vue-app/ROADMAP.md)**: Frontend milestone tracker.
- Package guides: [Backend README](./backend/README.md) | [Vue Client README](./vue-app/README.md)
