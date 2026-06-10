# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Frontend for a community-driven Gen 4 Pokémon competitive teambuilder. Consumes the REST API in `../server/`. Users browse, create, and share competitive teams.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · TanStack Query 5

## Commands

```bash
npm run dev      # dev server on http://localhost:3000
npm run build    # production build
npm run start    # run production build
```

## Architecture

**App Router** — all routes live in `app/`. Each folder is a route segment; `page.tsx` is the page, `layout.tsx` wraps children.

**Planned pages:**
- `app/page.tsx` — team browser with filters
- `app/teams/[id]/page.tsx` — team detail
- `app/teams/new/page.tsx` — create team
- `app/teams/[id]/edit/page.tsx` — edit team
- `app/users/[id]/page.tsx` — user profile
- `app/login/page.tsx` — login
- `app/register/page.tsx` — register

## Data Fetching

**TanStack Query** handles all server state (teams, users, likes).

Game data (pokémons, moves, abilities, items, natures, formats) lives in `../data/` at the monorepo root — shared with the server. Import directly, no API calls needed for static data.

## Auth

JWT is stored in an **httpOnly cookie** set by a Next.js API route — never in localStorage. Attach credentials to all authenticated API calls via `credentials: 'include'`.

Auth flow:
- `app/api/auth/login/route.ts` — receives JWT from the backend, sets httpOnly cookie
- `app/api/auth/logout/route.ts` — clears the cookie

## API

Backend runs on `http://localhost:3000` in dev (or `NEXT_PUBLIC_API_URL` in production). All fetch calls go through a central client utility — do not call `fetch` directly in components.

## Types

Types are duplicated from `../server/src/types/` — not imported across the monorepo boundary. Keep them in sync manually when the server types change.

## Styling

Tailwind CSS 4 with the App Router. Global styles in `app/globals.css`. Component-level styles via Tailwind utility classes only — no CSS modules or inline styles.
