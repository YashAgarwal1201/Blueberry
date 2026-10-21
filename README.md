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

### Code Quality, Testing & CI/CD

Blueberry maintains high software quality standards with automated static typing, linting, unit testing, and container builds across the entire monorepo.

#### Local CI & Pre-Push Hook
To set up local git hooks and mirror CI verification before pushing:
```bash
# 1. Install git pre-push hook (one-time setup)
./scripts/setup-hooks.sh

# 2. Run local CI verification suite anytime (all 4 phases)
./scripts/run-ci-local.sh

# Optional flags:
# ./scripts/run-ci-local.sh --skip-build   # Fast check without full production build
# ./scripts/run-ci-local.sh --backend      # Run backend checks only
# ./scripts/run-ci-local.sh --frontend     # Run frontend checks only
```

#### GitHub Actions CI/CD Pipeline
Every pull request and push to `main` and `development` triggers automated verification via [`.github/workflows/ci.yml`](./.github/workflows/ci.yml):
- **Backend CI**: TypeScript compilation (`tsc -p tsconfig.build.json --noEmit`), Jest test suite (14 suites, 96 tests), and production build.
- **Frontend CI**: Vue/TypeScript compilation (`vue-tsc -p tsconfig.vitest.json --noEmit`), ESLint, Vitest test suite (63 suites, 238 tests), and Vite PWA build.
- **Container Publishing**: On successful pushes to `main` or `development`, container images are automatically built and published to GitHub Container Registry (`ghcr.io`).

### Self-Hosting with Docker Compose

Blueberry is optimized for zero-config production self-hosting via Docker Compose.

#### 1. Configuration & Launch

```bash
# 1. Copy the example environment file
cp .env.docker.example .env

# 2. Generate a secure 32-character secret for Better-Auth
openssl rand -base64 32
# Paste the generated string into BETTER_AUTH_SECRET in .env

# 3. Configure the external URL you will use to access Blueberry
# (e.g. http://192.168.1.100:5130 or https://blueberry.yourdomain.com)
# BETTER_AUTH_URL=http://localhost:5130

# 4. Build and launch all containers
docker compose up -d --build
```

- **Frontend SPA**: `http://localhost:5130` (or your configured `PORT_FRONTEND`)
- **Backend API & Healthcheck**: `http://localhost:8100/health`
- **Data Persistence**: SQLite database stored in Docker volume `blueberry_data` (`/app/backend/data/app.db`).

#### 2. Initial Admin User Bootstrapping

Blueberry uses 3-tier Role-Based Access Control (`admin`, `moderator`, `user`). When first deployed, newly registered accounts are assigned the `user` role.

To bootstrap your initial administrator account:
```bash
# Step 1: Open http://localhost:5130/register in your browser and create your account.

# Step 2: Promote your account to admin via the container CLI:
docker compose exec backend node scripts/set-admin.js your-email@example.com

# Step 3: Verify the account role:
docker compose exec backend node scripts/list-users.js
```
*Once promoted, log in to access the User Management panel at `/settings/users`, manage permissions, ban/unban users, and moderate content.*

#### 3. Reverse Proxy & SSL Termination (Caddy, Traefik, Nginx)

When deploying behind an external reverse proxy (Cloudflare Tunnels, Caddy, Traefik, or Nginx Proxy Manager):
1. Point your proxy to `http://<server-ip>:5130`.
2. Ensure your proxy passes standard headers: `Host`, `X-Real-IP`, `X-Forwarded-For`, and `X-Forwarded-Proto`. (Blueberry's internal Nginx gateway automatically preserves upstream SSL protocols).
3. Set `BETTER_AUTH_URL=https://blueberry.yourdomain.com` in `.env` to enable secure session cookies.

**Caddyfile Example:**
```caddy
blueberry.yourdomain.com {
    reverse_proxy localhost:5130
}
```

**Nginx / Nginx Proxy Manager Example:**
```nginx
server {
    server_name blueberry.yourdomain.com;
    location / {
        proxy_pass http://127.0.0.1:5130;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### 4. Backups & Upgrades

```bash
# Zero-downtime database backup
docker cp blueberry-backend:/app/backend/data/app.db ./backup-$(date +%F).db

# Upgrade Blueberry to the latest version
git pull
docker compose build --no-cache
docker compose up -d

# View container logs & status
docker compose ps
docker compose logs -f backend
docker compose logs -f frontend
```

## Documentation & Roadmap

- **[Technical Architecture & Specification (`SPEC.md`)](./SPEC.md)**: Authoritative architecture, data schemas, dual-deployment model, multi-engine DB abstraction, and Tulip MCP protocol.
- **[Backend Roadmap](./backend/ROADMAP.md)**: Backend milestone tracker.
- **[Vue Client Roadmap](./vue-app/ROADMAP.md)**: Frontend milestone tracker.
- Package guides: [Backend README](./backend/README.md) | [Vue Client README](./vue-app/README.md)
