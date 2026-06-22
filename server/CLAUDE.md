# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A community-driven Gen 4 Pokémon competitive teambuilder API. Users build and publish teams; anyone can browse and filter them. The Pokédex also carries a real, database-backed Community layer (competitive movesets, proposals, votes, moderation) — see "Pokémon Analyses (Community Layer)" below.

**Stack:** Node.js · Express 5 · TypeScript · Drizzle ORM · Zod · JWT · bcrypt · helmet · express-rate-limit · PostgreSQL (local) / Neon (production) · Railway deployment

## Commands

```bash
npm run dev            # tsx watch — hot-reload dev server on port 3000
npm run build           # tsc — compile to dist/
npm run start            # node dist/index.js — run compiled output
npm run db:generate       # drizzle-kit generate — create migration from schema changes
npm run db:migrate         # drizzle-kit migrate — apply pending migrations
npm run seed:tyranitar      # tsx scripts/seed-tyranitar.ts — seed Tyranitar's AI-baseline Community content (idempotent)
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
  app.ts              # express app — helmet() first, then CORS, then route mounting
  errors.ts           # AppError(status, message) — thrown by services, caught in app.ts
  db/
    index.ts          # drizzle Pool + db instance
    schema.ts         # all Drizzle table/enum definitions
  middleware/
    auth.ts           # authenticateToken (required), optionalAuth, requireRole(...roles) —
                      # all three check users.token_version against the JWT's embedded
                      # value (see "Auth & JWT Revocation" below), not just signature/expiry
    rateLimit.ts       # loginLimiter (10/15min/IP), registerLimiter (5/hour/IP)
  routes/
    auth.ts           # POST /auth/register (no token returned), POST /auth/login,
                      # GET /auth/me, POST /auth/logout-all
    gamedata.ts       # GET /gamedata/{pokemons,moves,abilities,items,natures,formats,learnsets}
    teams.ts          # CRUD /teams, POST/DELETE /teams/:id/likes
    users.ts          # GET/PATCH /users/:id
    analysis.ts        # /pokemon-analyses/* — see "Pokémon Analyses" below
  schemas/
    team.ts           # Zod: pokemonSchema, createTeamSchema
    analysis.ts        # Zod: analysisPageSchema, setSchema, proposalSchema
  services/
    authService.ts    # register(), login() (timing-safe — see Security), logoutAll()
    teamService.ts     # list/get/create/update/delete teams, like/unlike
    teamValidation.ts  # validateTeam() — in-memory cross-ref logic
    userService.ts     # getUser(), updateUser() — password changes bump token_version
    analysisService.ts # see "Pokémon Analyses" below
  types/
    index.ts          # Pokemon type, Express Request augmentation (req.userId)
  data/json/          # immutable game data — abilities, formats, items, learnsets,
                      # moves, natures, pokemons
scripts/
  seed-tyranitar.ts   # one-time/idempotent: seeds Tyranitar's Community content (see below)
drizzle/              # generated migration files
drizzle.config.ts     # points at src/db/schema.ts, outputs to drizzle/
documentation/        # project docs (DATABASE.md covers the original team/user schema only —
                      # not yet updated for the Community tables)
package.json
tsconfig.json
```

## Architecture: Static vs. Dynamic Data

The core architectural decision is a strict split between two data stores:

- **JSON files** (`src/data/json/`) — all immutable game data. Loaded into server memory at startup so the service layer can validate requests without DB queries. IDs in the database (e.g., `pokemon_id`, `move_id`) reference these JSON entries, not foreign-keyed rows.
- **PostgreSQL** — user-generated content: `users`, `teams`, `teams_pokemons`, `teams_pokemons_moves`, `team_likes`, plus the Community-layer tables (`pokemon_analyses`, `analysis_sets`, `analysis_revisions`, `analysis_proposals`, `proposal_votes`).

`formats.json` entries include `banned_moves` and `banned_items` arrays of integer IDs validated server-side on publish/update.

## Security

- **Passwords** — bcrypt, cost factor 12.
- **Timing-safe login** (`authService.ts`) — a module-level `DUMMY_HASH` constant (a real precomputed bcrypt hash) is compared against when the email doesn't exist, so `login()` always pays the same bcrypt cost regardless of whether the account exists. Don't reintroduce an early `if (!user) throw ...` before the `bcrypt.compare` call — that's exactly the timing leak this avoids.
- **Rate limiting** (`middleware/rateLimit.ts`) — `loginLimiter` (10/15min/IP) on `POST /auth/login`, `registerLimiter` (5/hour/IP) on `POST /auth/register`. In-memory store (express-rate-limit default) — resets on process restart, doesn't share state across multiple instances. Fine for the current single-process deployment; swap to a Redis-backed store first if this ever scales horizontally.
- **`helmet()`** applied globally in `app.ts`, before CORS. Defaults only — no custom CSP, since this server only ever emits JSON.
- **JWT revocation via `tokenVersion`** — JWTs are normally stateless and unrevocable before expiry. `users.token_version` (int, default 0) is embedded in every signed token (`authService.login`) and checked against the live DB value on **every** authenticated request (`middleware/auth.ts#tokenStillValid` — used by `authenticateToken`, `optionalAuth`, and transitively `requireRole`). A mismatch is rejected even with a valid signature and unexpired `exp`. This is the one place that trades JWT statelessness for an extra indexed `WHERE id = ?` lookup per request — intentional, not an oversight. Two things bump `token_version`:
  - `POST /auth/logout-all` (`authService.logoutAll`)
  - Any password change (`userService.updateUser`, when `data.password` is set) — `updates.tokenVersion = sql\`${users.tokenVersion} + 1\`` alongside the new hash
- **CORS fails closed** — see Environment Variables above; don't add a fallback default for `CLIENT_ORIGIN`.
- **Role-based authorization** — `users.role` enum (`user`/`moderator`/`admin`, default `user`). `requireRole(...roles)` must run after `authenticateToken` (needs `req.userId`); it independently re-checks `req.userId` is set before querying, since it's sometimes reasoned about as a standalone guard. No self-service promotion exists — `role` is set directly in the DB.
- **No raw-string SQL** — every dynamic query goes through Drizzle's query builder or a tagged `sql\`...${value}...\`` template (which parameterizes automatically). Never build a query with plain string concatenation/interpolation outside that tag.
- **Update endpoints use field-by-field allowlists, not `{...req.body}` spreads** — `userService.updateUser()` builds its `updates` object key-by-key from a typed `UpdateUserData`, and `patchUserSchema` (Zod) doesn't include `role` at all. This is *why* a user can't self-promote to moderator through `PATCH /users/:id` — preserve this pattern in any new mutation endpoint rather than spreading validated input straight into `.set()`.

## Validation Strategy

Validation is split between two layers (this table covers **team** validation only — the Community layer's validation is simpler, see below):

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

For the Community layer, `schemas/analysis.ts`'s `setSchema`/`proposalSchema` validate shape and length only (e.g. `evs` is a free-text display string like `"4 HP / 252 Atk / 252 Spe"`, not per-stat-validated — this is reference/wiki content, not an enforced playable team, unlike `createTeamSchema`).

## Key Database Relationships

- `teams.user_id → users`: **SET NULL** — teams survive user deletion, displayed as "Deleted user"
- `teams_pokemons.team_id → teams`: **CASCADE**
- `teams_pokemons_moves.teams_pokemon_id → teams_pokemons`: **CASCADE**
- `team_likes.user_id → users`: **CASCADE** — likes removed when user deletes account
- `team_likes.team_id → teams`: **CASCADE** — likes removed when team is deleted
- `pokemon_analyses.created_by → users`: **SET NULL**
- `analysis_sets.analysis_id → pokemon_analyses`: **CASCADE**; `created_by`/`updated_by → users`: **SET NULL**
- `analysis_revisions.analysis_id → pokemon_analyses`: **CASCADE**; `set_id → analysis_sets`: **SET NULL**; `author_id → users`: **SET NULL**
- `analysis_proposals.analysis_id → pokemon_analyses`: **CASCADE**; `author_id → users`: **SET NULL**
- `proposal_votes.proposal_id → analysis_proposals`: **CASCADE**; `proposal_votes.user_id → users`: **CASCADE**

`team_likes` and `proposal_votes` both have composite `PRIMARY KEY (user_id/proposal_id, ...)`. Duplicate like/vote attempts return 409 via pg error code `23505` — **note this code arrives as `error.cause.code`, not `error.code`, because drizzle-orm wraps the underlying pg error.** Every duplicate-key catch in this codebase checks `(error?.cause?.code ?? error?.code) === "23505"` for exactly this reason; don't drop back to the unwrapped check.

`teams_pokemons` and `teams_pokemons_moves` store integer IDs (not names) so filtering in `teamService.listTeams()` can match against `pokemon_id`/`move_id`/etc. directly via `EXISTS` subqueries. No explicit indexes are defined on these columns today (only the PKs/FKs in `schema.ts`) — something to revisit if `GET /teams` filtering gets slow at scale.

`analysis_sets` has a composite unique constraint on `(analysis_id, order_index)` to prevent two concurrent "add a set" requests from landing on the same display position — `analysisService.createSet()` wraps the read-then-write in a transaction and translates the resulting `23505` into a `409` rather than crashing.

`username` is immutable after registration. `pokemons.json` entries include an `evolvesFrom` field (nullable integer ID) used to walk the evolution chain during learnset validation.

## Pokémon Analyses (Community Layer)

A real, database-backed wiki-style layer on top of the static Pokédex: competitive movesets, contributors, an edit history, and a propose/vote/moderate workflow. Lives entirely in `routes/analysis.ts`, `services/analysisService.ts`, `schemas/analysis.ts`, and the five tables listed under Database above.

- **`GET /pokemon-analyses/:pokemonId` returns `null`, not 404,** when nobody's contributed yet — every real Pokémon is a valid target, it just might be empty. Only `tyranitar` has seeded content today (`npm run seed:tyranitar`).
- **Contributors and their role (Creator/Editor/AI draft) are computed live** from `analysis_revisions` (`analysisService.ts#getContributors`) — there's no stored contributor table or edit-count column. "Creator" = the author of that analysis's very first revision, but only if that revision is human; an AI-seeded page has no Creator, only an AI-draft contributor. Don't add a stored counter here; extend the live aggregation instead, matching the same "computed, not stored" convention `teams.likes_count` already uses.
- **`analysis_sets.is_ai_draft`** flips to `false` automatically the moment a human edits that set (`updateSet()`) — editing an AI draft *is* the review step, there's no separate "approve" action for sets (only for proposals).
- **Proposals are atomically claimed, not check-then-update.** `acceptProposal`/`rejectProposal` do `UPDATE analysis_proposals SET status = 'accepted' WHERE id = ? AND status = 'pending' RETURNING *` — the `WHERE status = 'pending'` *is* the concurrency guard, so only one of two simultaneous accept/reject calls can succeed; the other gets a clean 409 via `explainUnclaimable()`. **Don't refactor this back into a `SELECT` followed by a separate `UPDATE`** — that reintroduces a TOCTOU race where both calls could pass the check before either writes.
- **`getOrCreateAnalysis()` uses `onConflictDoNothing` + re-select**, not `SELECT` then `INSERT`, for the same reason — two concurrent first-contributions to the same Pokémon would otherwise race on the `pokemon_analyses.pokemon_id` unique constraint.
- **`voteProposal` checks `proposal.status === "pending"`** before inserting — voting on an already-resolved proposal is rejected rather than silently recording an orphan vote.
- Seeding pattern (`scripts/seed-tyranitar.ts`): the whole seed is one `db.transaction` (a partial failure must not leave a half-seeded row, since the idempotency check just looks for *any* existing `pokemon_analyses` row and would then skip forever). If you write a similar seed script for another Pokémon, copy that transaction wrapping.

## API Surface

**Auth** (JWT access token, 7-day expiry, revocable via `token_version` — see Security — `Authorization: Bearer <token>`):
- `POST /auth/register` — returns the new `user` object **only, no token** (rate limited 5/hour/IP). Callers must call `/auth/login` separately.
- `POST /auth/login` — returns `{ token, user }` (rate limited 10/15min/IP); `user` includes `id`, `username`, `email`, `avatar`, `bio`, `role`, `createdAt`
- `GET /auth/me` — returns `{ user }` in the same shape, from the bearer token's `userId`
- `POST /auth/logout-all` — invalidates every token issued to this account (bumps `token_version`)

**Static data** (JSON-backed, no DB queries — all under `/gamedata`):
- `GET /gamedata/pokemons`, `/gamedata/moves`, `/gamedata/abilities`, `/gamedata/items`, `/gamedata/natures`, `/gamedata/formats`, `/gamedata/learnsets`

**Teams**:
- `GET /teams` — browse with filters, paginated
- `GET /teams/count` — total matching rows for the same filters (drives the client's `totalPages`)
- `GET /teams/format-counts` — published-team count per format
- `POST /teams` — publish (auth required)
- `GET /teams/:id`
- `PUT /teams/:id` — full team replacement (auth, owner only)
- `DELETE /teams/:id` (auth, owner only)

**Likes**:
- `POST /teams/:id/likes` — like (auth required)
- `DELETE /teams/:id/likes` — unlike (auth required)

**Users**:
- `GET /users/:id` — public profile + a lean teams array (id/name/format/likes only, no pokemons — the client fetches `GET /teams?user=<id>` instead for the full display shape, see client/CLAUDE.md's `useUserProfile`)
- `PATCH /users/:id` — update email, password, avatar, or bio (auth, own account; email/password require `currentPassword`). `avatar: ""` is a sentinel for "clear the avatar" (stored as `NULL`) — distinct from omitting the field, which leaves the existing avatar untouched. A password change also revokes all other sessions (see Security).

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

**Pokémon Analyses** (see "Pokémon Analyses (Community Layer)" above for the behavioral notes):
- `GET /pokemon-analyses/:pokemonId` (optional auth — adds `hasVoted` to proposals when authenticated)
- `PATCH /pokemon-analyses/:pokemonId` (auth) — role/overview
- `POST /pokemon-analyses/:pokemonId/sets` (auth)
- `PATCH /pokemon-analyses/sets/:setId` (auth)
- `POST /pokemon-analyses/:pokemonId/proposals` (auth)
- `POST /pokemon-analyses/proposals/:id/votes` (auth)
- `DELETE /pokemon-analyses/proposals/:id/votes` (auth)
- `POST /pokemon-analyses/proposals/:id/accept` (auth + `requireRole("moderator", "admin")`)
- `POST /pokemon-analyses/proposals/:id/reject` (auth + `requireRole("moderator", "admin")`)

## Schema Changes

Always update `src/db/schema.ts`, then run `npm run db:generate` and `npm run db:migrate`. Do not edit `schema.sql` or migration files directly.
