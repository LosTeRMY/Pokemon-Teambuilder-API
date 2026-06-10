# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A community-driven Gen 4 Pokémon competitive teambuilder API. Users build and publish teams; anyone can browse and filter them.

**Stack:** Node.js · Express · TypeScript · Drizzle ORM · Zod · JWT · PostgreSQL (local) / Neon (production) · Railway deployment

## Commands

```bash
npm run dev          # tsx watch — hot-reload dev server on port 3000
npm run build        # tsc — compile to dist/
npm run start        # node dist/index.js — run compiled output
npm run db:generate  # drizzle-kit generate — create migration from schema changes
npm run db:migrate   # drizzle-kit migrate — apply pending migrations
```

No test runner is configured (`npm test` exits 1).

## Environment Variables

Create `.env` with:

```
DATABASE_URL=   # postgres connection string (local or Neon)
JWT_SECRET=     # any secret string
PORT=3000       # optional, defaults to 3000
ASSETS_URL=     # base URL for sprites/icons — not stored in DB or JSON
```

## Code Structure

```
src/
  index.ts            # entry: env validation, starts server
  app.ts              # express app, route mounting
  db/
    index.ts          # drizzle Pool + db instance
    schema.ts         # all Drizzle table/enum definitions
  middleware/
    auth.ts           # authenticateToken (required) + optionalAuth
  routes/
    auth.ts           # POST /auth/register, POST /auth/login
    gamedata.ts       # GET /gamedata/{pokemons,moves,abilities,items,natures,formats,learnsets}
    teams.ts          # CRUD /teams, POST/DELETE /teams/:id/likes
    users.ts          # GET/PATCH/DELETE /users/:id
  schemas/
    team.ts           # Zod: pokemonSchema, createTeamSchema
  services/
    teamValidation.ts # validateTeam() — in-memory cross-ref logic
  types/
    index.ts          # Pokemon type, Express Request augmentation (req.userId)
  data/json/          # immutable game data — abilities, formats, items, learnsets,
                      # moves, natures, pokemons
drizzle/              # generated migration files
drizzle.config.ts     # points at src/db/schema.ts, outputs to drizzle/
documentation/        # project docs
package.json
tsconfig.json
```

## Architecture: Static vs. Dynamic Data

The core architectural decision is a strict split between two data stores:

- **JSON files** (`src/data/json/`) — all immutable game data. Loaded into server memory at startup so the service layer can validate requests without DB queries. IDs in the database (e.g., `pokemon_id`, `move_id`) reference these JSON entries, not foreign-keyed rows.
- **PostgreSQL** — user-generated content only (`users`, `teams`, `teams_pokemons`, `teams_pokemons_moves`, `team_likes`).

`formats.json` entries include `banned_moves` and `banned_items` arrays of integer IDs validated server-side on publish/update.

## Validation Strategy

Validation is split between two layers:

| What | Where | Why |
|---|---|---|
| IVs 0–31, EVs 0–252 | DB `CHECK` constraints | Native to SQL |
| Unique Pokémon per team | DB `UNIQUE (team_id, pokemon_id)` | Uniqueness constraint |
| Cascading deletes | DB `CASCADE` / `SET NULL` | Referential integrity |
| Max 4 moves, exactly 6 Pokémon | Zod (`createTeamSchema`) | SQL can't constrain row count |
| Total EVs ≤ 508 | Zod `superRefine` | Cross-column sum |
| Happiness 0–255, default 255 | Zod | Gen 4 range |
| Pokémon/move/ability/item/nature validity | Zod + in-memory JSON | References JSON, not a DB table |
| Ability legal for Pokémon | `validateTeam()` | `pokemon.abilities[]` array in pokemons.json |
| Move in learnset | `validateTeam()` | Walks `evolvesFrom` chain via learnsets.json |
| Pokémon legal in tier | `validateTeam()` | Tier hierarchy: lc < pu < nu < uu < ou < ubers |
| Move/item not in format's banned list | `validateTeam()` | formats.json |
| Level | Set server-side in `validateTeam()` | 5 for LC, 100 for all others — client value ignored |

A team in the database is by definition valid and public. **Drafts are never persisted** — they live in the client's localStorage until publication.

## Key Database Relationships

- `teams.user_id → users`: **SET NULL** — teams survive user deletion, displayed as "Deleted user"
- `teams_pokemons.team_id → teams`: **CASCADE**
- `teams_pokemons_moves.teams_pokemon_id → teams_pokemons`: **CASCADE**
- `team_likes.user_id → users`: **CASCADE** — likes removed when user deletes account
- `team_likes.team_id → teams`: **CASCADE** — likes removed when team is deleted

`team_likes` has `PRIMARY KEY (user_id, team_id)`. Duplicate like attempts return 409 via pg error code `23505`.

`teams_pokemons` and `teams_pokemons_moves` store integer IDs (not names) to enable indexed B-tree lookups on filtered `GET /teams` queries. Indexes exist on `teams_pokemons(pokemon_id)`, `teams_pokemons(ability_id)`, `teams_pokemons_moves(move_id)`, and `team_likes(team_id)`.

`username` is immutable after registration. `pokemons.json` entries include an `evolvesFrom` field (nullable integer ID) used to walk the evolution chain during learnset validation.

## API Surface

**Auth** (JWT access token, 7-day expiry — `Authorization: Bearer <token>`):
- `POST /auth/register`, `POST /auth/login`

**Static data** (JSON-backed, no DB queries — all under `/gamedata`):
- `GET /gamedata/pokemons`, `/gamedata/moves`, `/gamedata/abilities`, `/gamedata/items`, `/gamedata/natures`, `/gamedata/formats`, `/gamedata/learnsets`

**Teams**:
- `GET /teams` — browse with filters
- `POST /teams` — publish (auth required)
- `GET /teams/:id`
- `PUT /teams/:id` — full team replacement (auth, owner only)
- `DELETE /teams/:id` (auth, owner only)

**Likes**:
- `POST /teams/:id/likes` — like (auth required)
- `DELETE /teams/:id/likes` — unlike (auth required)

**Users**:
- `GET /users/:id` — public profile + teams
- `PATCH /users/:id` — update email, password, avatar, or bio (auth, own account; email/password require `currentPassword`)
- `DELETE /users/:id` (auth, own account)

**`GET /teams` query params:**
`?pokemon=&move=&ability=&item=&format=&name=&user=&liked_by=&sort=newest|oldest|popular&page=&limit=`

`liked_by=me` is resolved server-side from the JWT. Team list responses include `likes_count` (live COUNT) and `liked` (boolean for authenticated users, `null` for unauthenticated).

## Schema Changes

Always update `src/db/schema.ts`, then run `npm run db:generate` and `npm run db:migrate`. Do not edit `schema.sql` or migration files directly.
