# Blueberry

Blueberry is a modern, responsive web application for discovering, managing, and curating movies, TV shows, and cast details. The project is structured as a full-stack monorepo featuring a Vue 3 frontend and an Express Node.js backend.

## Project Structure

This monorepo consists of three main packages:

- **[`vue-app/`](./vue-app/)**: The frontend client built with Vue 3, Vite, Pinia, and Tailwind CSS.
- **[`express/`](./express/)**: The backend REST API built with Express, TypeScript, and SQLite (via `better-sqlite3`).
- **[`shared/`](./shared/)**: Shared TypeScript types and interfaces used by both the frontend and backend to ensure end-to-end type safety.

## Features

- **Authentication** — Secure user registration, login, password recovery, and profile management (powered by [Better-Auth](https://better-auth.com/)).
- **Media Discovery** — Browse, filter, and discover movies, TV shows, and people with rich, detailed metadata pages.
- **Custom Content Forms** — Client-side forms to add user-generated movies and cast members, including a dedicated cast editor UI.
- **Watchlist Management** — UI to keep track of content you want to see by managing a personal watchlist.
- **Responsive UX** — Shared UI patterns across desktop and mobile devices featuring media drawers, hero carousels, and side menus.
- **SQLite Database** — Fast and reliable data persistence with a robust API architecture designed to avoid overfetching and the N+1 problem.

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v20+ recommended) and `npm` installed.

### Setup

1. **Install Dependencies**
   Navigate to both the frontend and backend directories to install their respective dependencies:
   ```bash
   cd express && npm install
   cd ../vue-app && npm install
   cd ../shared && npm install
   ```

2. **Environment Variables**
   Set up your environment variables for both packages by copying the example files:
   ```bash
   cp express/.env.example express/.env
   cp vue-app/.env.example vue-app/.env
   ```

3. **HTTPS Certificates (Recommended)**
   Both the frontend and backend are configured to run locally via HTTPS. Use [`mkcert`](https://github.com/FiloSottile/mkcert) to generate the necessary local certificates.
   
   Generate certs in both directories:
   ```bash
   # Backend Certs
   mkdir -p express/certs
   cd express/certs
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
cd express
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd vue-app
npm run dev
```

- The API will be available at `https://localhost:8100`
- The Vue app will be available at `https://localhost:5130`

## Documentation & Roadmap

For more details on specific packages, please refer to their respective READMEs:
- [Express Backend README](./express/README.md)
- [Vue Client README](./vue-app/README.md)

Check out the `ROADMAP.md` in each package to see the development plan and what's coming next!
