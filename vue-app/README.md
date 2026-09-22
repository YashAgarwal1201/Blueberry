# Blueberry - Vue Client

A modern, responsive frontend web client for discovering, managing, and curating movies, TV shows, and cast details. Built as the user interface for the Blueberry media ecosystem.

## Features

- **Authentication UI** — Frontend interfaces for user registration, login, password recovery, and profile management (powered by Better-Auth client)
- **Media Discovery** — Browse, filter, and discover movies, TV shows, and people with rich, detailed metadata pages
- **Custom Content Forms** — Client-side forms to add user-generated movies and cast members, including a dedicated cast editor UI
- **Watchlist Management** — UI to keep track of content you want to see by managing a personal watchlist
- **Responsive UX** — Shared UI patterns across desktop and mobile devices featuring media drawers, hero carousels, and side menus

## Tech Stack

| Concern                   | Choice                                                             |
| ------------------------- | ------------------------------------------------------------------ |
| Framework                 | Vue 3 + TypeScript + Vite                                          |
| Routing                   | Vue Router                                                         |
| State                     | Pinia                                                              |
| Styling                   | Tailwind CSS (v4) + PrimeVue                                       |
| Authentication            | Better-Auth                                                        |
| Data Fetching             | Axios + Better-Fetch                                               |
| Icons                     | Lucide Vue Next + PrimeIcons                                       |
| Linting/Formatting        | ESLint, Prettier                                                   |

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Copy the example environment file to `.env`:
   ```bash
   cp .env.example .env
   ```

3. **Setup local HTTPS (Recommended for secure development)**
   Blueberry supports HTTPS for local development. You'll need [mkcert](https://github.com/FiloSottile/mkcert) to generate valid local certificates.
   
   Install `mkcert` on your system (e.g., `brew install mkcert` on macOS, or see their [repo](https://github.com/FiloSottile/mkcert) for other OS instructions). Then, generate the certificates in a `certs/` directory:
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

5. **Build for production**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
  components/    # Reusable UI components (Carousels, Media Cards, Navbars)
  composables/   # Shared Vue composition logic
  lib/           # Library configurations and helpers
  views/         # Feature and Route components (Auth, Movies, Profile, etc.)
  plugins/       # Vue plugins setup
  router/        # Vue Router setup and route definitions
  services/      # API communication layers
  stores/        # Pinia stores for state management
  types/         # Local TypeScript types (also uses ../shared)
```

## Backend Integration

This Vue client relies on its companion Express backend to function. It communicates via REST APIs to fetch media data, handle user authentication securely, and persist user-generated content (like custom movies and watchlists).

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for the detailed development plan and checklist.
