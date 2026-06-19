# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

PokéBuild — a community-driven Gen 4 Pokémon competitive teambuilder. Users build teams client-side and publish them; anyone can browse and filter the community library.

## Monorepo Layout

Two independent Node projects (no root `package.json`/workspaces — each has its own) that share a read-only game-data directory:

```text
data/           # shared immutable game data (JSON) — source of truth
server/         # Express + Drizzle API — see server/CLAUDE.md
client/         # Next.js frontend — see client/CLAUDE.md (currently being rebuilt)
```

Each workspace has its own `package.json`, `node_modules`, and `CLAUDE.md` with stack details, commands, and architecture notes. Read the relevant sub-file before working in that workspace.

A handful of one-off `.mjs` scripts at the repo root (`reindex.mjs`, `remap-learnsets.mjs`, `extract-gen4-learnsets.mjs`) were used to bulk-edit `data/*.json` during the Gen 4 data buildout (reindexing IDs, remapping learnsets). They write to both `data/` and `client/data/` directly — treat them as scratch tooling, not part of the runtime app.

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
3. The route sets the JWT in an **httpOnly cookie** — unreachable by JS
4. All subsequent fetch calls use `credentials: 'include'` to send the cookie

The Express server must validate the token on every authenticated request. The Next.js proxy exists solely to set/clear the httpOnly cookie.

## Draft Teams

Teams are **never persisted until published**. While a user is building a team, the draft lives in `localStorage` on the client. Publication calls `POST /teams`, which validates the complete team server-side. There is no "save draft" API endpoint and no partial team in the database.

## Styling

The client is styled with **Tailwind v4 utility classes bound to a CSS custom property token set** in `app/globals.css` — not hand-written CSS per component. CSS variables define color tokens (`--accent`, `--surface`, `--ink`, etc.) with separate `:root` (light) and `[data-theme="dark"]` blocks; a Tailwind `@theme` block maps each one to a `--color-*` variable, so `bg-surface`, `text-ink`, `border-line` etc. are ordinary Tailwind utilities that resolve to the live theme value. Theme is toggled by setting `data-theme` on `<html>`, and the class `theme-switching` is briefly applied to suppress transition flicker during the switch. A small "Residual CSS" section at the bottom of `globals.css` holds hand-written classes only for what Tailwind utilities can't express — `color-mix()` with a dynamic `--th`/`--cp`-style custom property, `text-wrap: pretty`, pseudo-elements, and parent/child selectors.

## Current Status

- **Server** (`server/`) — fully implemented. Express + Drizzle + PostgreSQL. No test runner. See `server/CLAUDE.md` for API surface, validation strategy, and schema details.
- **Client** (`client/`) — partially implemented. Team browser (`/`), Pokédex (`/pokedex`), and the team builder (`/builder`) pages are working. Auth and TanStack Query wiring are not yet implemented — the team browser runs against `mockData.ts` (curated static teams) with client-side filtering, and `loggedIn` is hardcoded `true`. See `client/CLAUDE.md` for component and hook architecture.
