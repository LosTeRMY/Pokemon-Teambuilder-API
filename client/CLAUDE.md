# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · TanStack Query 5 · App Router

## Commands

```bash
npm run dev    # Turbopack dev server (default port 3000)
npm run build  # production build
npm run start  # run production build
npm run lint   # ESLint
```

Run with the API URL pointed at the server:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev
```

## Environment Variables

```
NEXT_PUBLIC_API_URL=   # Express API base URL (no trailing slash)
```

## Data

`client/data/` is a **physical copy** of `data/` at the repo root — Turbopack cannot follow junctions outside the project root. Keep them in sync when editing any JSON file.

Sprites are served from `public/sprites/gen4/<slug>.png`. Slug format is produced by `lib/lookups.ts#slug()`.

## Architecture

- **App Router** — pages under `app/`, shared layouts via `layout.tsx`
- **TanStack Query** — all server state fetched via query hooks
- **Auth** — httpOnly-cookie JWT issued through Next.js API routes (proxies to Express); not yet implemented; see root CLAUDE.md for flow details
- **Game data** — imported directly from `../data/*.json` at build time for client-side validation; also available from the server via `GET /gamedata/*` for runtime use
- **Draft teams** — never sent to the server until publication; stored in `localStorage`
