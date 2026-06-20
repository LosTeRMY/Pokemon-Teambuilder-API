# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PokéBuild — a community-driven Gen 4 Pokémon competitive teambuilder. Users build teams client-side and publish them; anyone can browse and filter the community library.

## Monorepo Layout

Two independent Node projects (no root `package.json`/workspaces — each has its own) that share a read-only game-data directory:

```text
data/           # shared immutable game data (JSON) — source of truth
server/         # Express + Drizzle API — see server/CLAUDE.md
client/         # Next.js frontend — see client/CLAUDE.md
```

Each workspace has its own `package.json`, `node_modules`, and `CLAUDE.md` with stack details, commands, and architecture notes. Read the relevant sub-file before working in that workspace.

## Running Both Sides

The server and client must run on **different ports**. Next.js defaults to 3000; pick a different port for the Express server (e.g. 3001):

```bash
# Terminal 1 — API
cd server
PORT=3001 npm run dev

# Terminal 2 — Frontend
cd client
NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev
```

## Shared Game Data

`data/` at the root contains the authoritative JSON files: `pokemons.json`, `moves.json`, `abilities.json`, `items.json`, `natures.json`, `formats.json`, `learnsets.json`.

- The server imports them from `../data/` (relative to `server/src/`)
- The client imports them from `../data/` (relative to project root)

**Important:** Turbopack cannot follow directory junctions outside the Next.js project root, so `client/data/` must be a **physical copy** of `data/`. When modifying any JSON file in `data/`, copy the change to `client/data/` too — they must stay in sync.

## Sprites

Pokémon sprites live only in `client/public/sprites/gen4/<slug>.png` (not under `data/`). Sprite filenames are the slug produced by the client's `lookups.ts#slug()` function.

## Auth Architecture

The client never stores JWTs in JavaScript-accessible storage. The flow:

1. Client POSTs credentials to a **Next.js API route** (`app/api/auth/login/route.ts`)
2. The route proxies to `POST /auth/login` on the Express server
3. The route sets the JWT in an **httpOnly cookie** (`pb_token`, see `client/lib/sessionCookie.ts`) — unreachable by JS

The Express server validates the token on every authenticated request, but it **only ever checks the `Authorization: Bearer <token>` header — it never reads cookies.** Since the cookie is httpOnly, client-side JS has no way to read the token and attach that header itself. So every call to the Express API, not just login/logout, goes through **`client/app/api/proxy/[...path]/route.ts`** — a generic Next.js route handler that reads the httpOnly cookie server-side and forwards it as `Authorization: Bearer` to Express. `client/lib/api.ts#apiFetch()` is the one place that calls this proxy; nothing in client code should call the Express origin (`NEXT_PUBLIC_API_URL`) directly except the proxy route itself and the `app/api/auth/*` routes.

If you add a new authenticated (or even optionally-authenticated) Express endpoint, calling it via `apiFetch()` is enough — no new proxy route needed, the catch-all already covers it. It exports handlers for all five verbs the API actually uses (GET/POST/PUT/PATCH/DELETE) — if you introduce a sixth, add it there too, or `apiFetch()` calls using it will fail.

## Draft Teams

Teams are **never persisted until published**. While a user is building a team, the draft lives in `localStorage` on the client. Publication calls `POST /teams`, which validates the complete team server-side. There is no "save draft" API endpoint and no partial team in the database.

## Styling

The client is styled with **Tailwind v4 utility classes bound to a CSS custom property token set** in `app/globals.css` — not hand-written CSS per component. CSS variables define color tokens (`--accent`, `--surface`, `--ink`, etc.) with separate `:root` (light) and `[data-theme="dark"]` blocks; a Tailwind `@theme` block maps each one to a `--color-*` variable, so `bg-surface`, `text-ink`, `border-line` etc. are ordinary Tailwind utilities that resolve to the live theme value. Theme is toggled by setting `data-theme` on `<html>`, and the class `theme-switching` is briefly applied to suppress transition flicker during the switch. A small "Residual CSS" section at the bottom of `globals.css` holds hand-written classes only for what Tailwind utilities can't express — `color-mix()` with a dynamic `--th`/`--cp`-style custom property, `text-wrap: pretty`, pseudo-elements, and parent/child selectors.

## Current Status

- **Server** (`server/`) — fully implemented. Express + Drizzle + PostgreSQL. No test runner. See `server/CLAUDE.md` for API surface, validation strategy, and schema details.
- **Client** (`client/`) — fully wired to the live API. Auth (login/register/logout/session restore), the team browser (`GET /teams`, replacing the old `mockData.ts` feed), the builder's publish/save flow (`POST`/`PUT /teams`, including the gender-enum and EV/IV key mapping in `client/lib/teamPublishMap.ts`), and the profile/account-settings pages (`GET /users/:id`, `PATCH /users/:id`) all hit the real Express server through the proxy described above. TanStack Query (`app/providers.tsx`) backs all of it. See `client/CLAUDE.md` for component and hook architecture.
