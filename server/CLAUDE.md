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
DATABASE_URL=    # postgres connection string (local or Neon) — required, process exits if missing
JWT_SECRET=      # any secret string — required, process exits if missing
PORT=3000        # optional, defaults to 3000
CLIENT_ORIGIN=   # browser origin allowed by CORS (e.g. http://localhost:3000) — required, process exits if missing
                 # (cors() silently falls back to Access-Control-Allow-Origin: * when origin is falsy, so
                 # app.ts fails loudly instead of allowing any origin to make credentialed requests)
```

## Code Structure

```
src/
  index.ts            # entry: env validation, starts server
  app.ts              # express app, route mounting
  errors.ts           # AppError(status, message) — thrown by services, caught in app.ts
  db/
    index.ts          # drizzle Pool + db instance
    schema.ts         # all Drizzle table/enum definitions
  middleware/
    auth.ts           # authenticateToken (required) + optionalAuth
  routes/
    auth.ts           # POST /auth/register, POST /auth/login
    gamedata.ts       # GET /gamedata/{pokemons,moves,abilities,items,natures,formats,learnsets}
    teams.ts          # CRUD /teams, POST/DELETE /teams/:id/likes
    users.ts          # GET/PATCH /users/:id
  schemas/
    team.ts           # Zod: pokemonSchema, createTeamSchema
  services/
    authService.ts    # register(), login() — bcrypt hashing, JWT issuance
    teamService.ts    # list/get/create/update/delete teams, like/unlike
    teamValidation.ts # validateTeam() — in-memory cross-ref logic
    userService.ts    # getUser(), updateUser()
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
| IVs 0–31, EVs 0–252 | Zod (`pokemonSchema`) | No DB `CHECK` constraints exist — range is app-level only |
| Cascading deletes | DB `CASCADE` / `SET NULL` (`schema.ts`) | Referential integrity |
| Max 4 moves, exactly 6 Pokémon | Zod (`createTeamSchema`) | SQL can't constrain row count |
| Total EVs ≤ 508 | Zod `.refine()` on the `evs` object | Cross-column sum |
| No duplicate move on one Pokémon | `validateTeam()` | Checked per-Pokémon against `pokemon.moves` |
| Happiness 0–255, default 255 | Zod | Gen 4 range |
| Pokémon/move/ability/item/nature validity | Zod + in-memory JSON | References JSON, not a DB table |
| Ability legal for Pokémon | `validateTeam()` | `pokemon.abilities[]` array in pokemons.json |
| Move in learnset | `validateTeam()` | Walks `evolvesFrom` chain via learnsets.json |
| Pokémon legal in tier | `validateTeam()` | Tier hierarchy: lc < pu < nu < uu < ou < ubers |
| Move/item not in format's banned list | `validateTeam()` | formats.json |
| Level | Set server-side in `validateTeam()` | 5 for LC, 100 for all others — client value ignored |

A team in the database is by definition valid and public. **Drafts are never persisted** — they live in the client's localStorage until publication.

**Gap:** nothing — not Zod, not `validateTeam()`, not a DB constraint — currently rejects the same Pokémon species appearing twice on one team. Be aware of this if you touch team creation/update; don't assume uniqueness is enforced elsewhere.

## Key Database Relationships

- `teams.user_id → users`: **SET NULL** — teams survive user deletion, displayed as "Deleted user"
- `teams_pokemons.team_id → teams`: **CASCADE**
- `teams_pokemons_moves.teams_pokemon_id → teams_pokemons`: **CASCADE**
- `team_likes.user_id → users`: **CASCADE** — likes removed when user deletes account
- `team_likes.team_id → teams`: **CASCADE** — likes removed when team is deleted

`team_likes` has `PRIMARY KEY (user_id, team_id)`. Duplicate like attempts return 409 via pg error code `23505`.

`teams_pokemons` and `teams_pokemons_moves` store integer IDs (not names) so filtering in `teamService.listTeams()` can match against `pokemon_id`/`move_id`/etc. directly via `EXISTS` subqueries. No explicit indexes are defined on these columns today (only the PKs/FKs in `schema.ts`) — something to revisit if `GET /teams` filtering gets slow at scale.

`username` is immutable after registration. `pokemons.json` entries include an `evolvesFrom` field (nullable integer ID) used to walk the evolution chain during learnset validation.

## API Surface

**Auth** (JWT access token, 7-day expiry — `Authorization: Bearer <token>`):
- `POST /auth/register`, `POST /auth/login` — both resolve to the same `{ token, user }` shape (`register` internally logs in); `user` includes `id`, `username`, `email`, `avatar`, `bio`, `createdAt`
- `GET /auth/me` — returns `{ user }` in the same shape, from the bearer token's `userId`

**Static data** (JSON-backed, no DB queries — all under `/gamedata`):
- `GET /gamedata/pokemons`, `/gamedata/moves`, `/gamedata/abilities`, `/gamedata/items`, `/gamedata/natures`, `/gamedata/formats`, `/gamedata/learnsets`

**Teams**:
- `GET /teams` — browse with filters, paginated
- `GET /teams/count` — total matching rows for the same filters (drives client-side `totalPages`)
- `POST /teams` — publish (auth required)
- `GET /teams/:id`
- `PUT /teams/:id` — full team replacement (auth, owner only)
- `DELETE /teams/:id` (auth, owner only)

**Likes**:
- `POST /teams/:id/likes` — like (auth required)
- `DELETE /teams/:id/likes` — unlike (auth required)

**Users**:
- `GET /users/:id` — public profile + a lean teams array (id/name/format/likes only, no pokemons — the client fetches `GET /teams?user=<id>` instead for the full display shape, see client/CLAUDE.md's `useUserProfile`)
- `PATCH /users/:id` — update email, password, avatar, or bio (auth, own account; email/password require `currentPassword`). `avatar: ""` is a sentinel for "clear the avatar" (stored as `NULL`) — distinct from omitting the field, which leaves the existing avatar untouched

**`GET /teams` query params:**
`?pokemon=&move=&ability=&item=&format=&name=&user=&liked_by=&sort=newest|oldest|popular&page=&limit=`

All of `pokemon`, `move`, `ability`, `item`, and the combo params below accept multiple values (repeat the param) — all must be present on the team (AND logic).

Combo filters (format `pokemonId:valueId`) link a specific Pokémon to a specific attribute:
- `pokemon_item` — Pokémon holding a specific item
- `pokemon_move` — Pokémon using a specific move
- `pokemon_ability` — Pokémon with a specific ability
- `pokemon_nature` — Pokémon with a specific nature

`liked_by=me` is resolved server-side from the JWT. Team list responses include `likes_count` (live COUNT) and `liked` (boolean for authenticated users, `null` for unauthenticated).

`teamService.ts` factors filter-building into `buildTeamConditions()`, shared by `listTeams()` and `countTeams()` — if you add a new filter param, add it there so the list and the count can never drift out of sync.

## Schema Changes

Always update `src/db/schema.ts`, then run `npm run db:generate` and `npm run db:migrate`. Do not edit `schema.sql` or migration files directly.
