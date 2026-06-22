# Pokémon Teambuilder API

A community-driven Gen 4 Pokémon teambuilder. Users build competitive teams
and share them publicly, and the Pokédex carries a real, database-backed
Community layer — competitive movesets, proposals, votes, and moderation —
on top of it.

## Stack

- **Runtime** — Node.js
- **Framework** — Express 5
- **Language** — TypeScript
- **ORM** — Drizzle
- **Validation** — Zod
- **Auth** — JWT (`jsonwebtoken`) + `bcrypt` password hashing
- **Hardening** — `helmet` (security headers), `express-rate-limit` (brute-force/spam throttling)
- **Database** — PostgreSQL (local) / Neon (production)
- **Deployment** — Railway + Neon

## Architecture

This project separates static game data (Pokémon, moves, abilities,
learnsets) from dynamic user/community data. Static data lives in JSON files
under `data/` at the repo root, loaded into server memory at startup — no DB
queries needed to validate a team or render the Pokédex. Dynamic data
(accounts, teams, likes, and the Pokémon-analysis Community layer) lives in
PostgreSQL.

See [documentation/DATABASE.md](./documentation/DATABASE.md) for a deep dive
on the original team/user schema's design decisions. The Community tables
(`pokemon_analyses` and friends, see below) were added later and aren't yet
covered there.

## Environment Variables

Create `server/.env` with:

```
DATABASE_URL=     # postgres connection string (local or Neon) — required, process exits if missing
JWT_SECRET=       # any secret string — required, process exits if missing
PORT=3000         # optional, defaults to 3000
CLIENT_ORIGIN=    # browser origin allowed by CORS (e.g. http://localhost:3000) — required, process exits if missing
                  # (cors() silently falls back to Access-Control-Allow-Origin: * when origin is falsy, so
                  # app.ts fails loudly instead of allowing any origin to make credentialed requests)
```

## Commands

```bash
npm run dev            # tsx watch — hot-reload dev server on port 3000
npm run build           # tsc — compile to dist/
npm run start            # node dist/index.js — run compiled output
npm run db:generate       # drizzle-kit generate — create migration from schema changes
npm run db:migrate         # drizzle-kit migrate — apply pending migrations
npm run seed:tyranitar     # seed Tyranitar's AI-baseline Community content (idempotent)
```

No test runner is configured (`npm test` exits 1).

## Security

- **Passwords** — bcrypt, cost factor 12. Never logged or returned in any
  response.
- **Timing-safe login** — `authService.login()` always runs a bcrypt
  comparison, even when the email doesn't exist (against a precomputed dummy
  hash), so a nonexistent email and a wrong password take the same time to
  reject. Without this, response timing alone could be used to enumerate
  which emails have accounts.
- **Rate limiting** (`express-rate-limit`, per IP) — `POST /auth/login`:
  10 requests / 15 minutes. `POST /auth/register`: 5 requests / hour. Both
  return `429` with a `Retry-After`-friendly message once exceeded.
- **Security headers** — `helmet()` applied globally (CSP-adjacent headers
  aren't tuned beyond the defaults, since this server only ever emits JSON,
  never HTML).
- **JWT revocation** — JWTs are normally stateless and can't be invalidated
  before they expire. This app embeds a `tokenVersion` integer (from
  `users.token_version`) in every signed token and checks it against the
  current DB value on every authenticated request
  (`middleware/auth.ts#tokenStillValid`) — a mismatch is rejected even if the
  token's signature and expiry are still valid. Two things bump it,
  invalidating every previously issued token at once:
  - `POST /auth/logout-all` — explicit "log out everywhere"
  - Changing your password (`PATCH /users/:id` with a new `password`) — so a
    password change actually kills any session an attacker might be holding
- **CORS fails closed** — the server refuses to start at all if
  `CLIENT_ORIGIN` isn't set, rather than letting the `cors` package fall back
  to allowing any origin.
- **Role-based authorization** — `users.role` (`user` / `moderator` /
  `admin`) gates moderator-only actions (accepting/rejecting Community
  proposals) via `middleware/auth.ts#requireRole`. There's no self-service way
  to grant moderator/admin yet — it's set directly in the database.
- **Ownership checks** — `PATCH /users/:id` and team mutations all verify
  `requestingUserId` matches the resource owner server-side; the update
  paths only ever write an explicit allowlist of fields (never a raw spread
  of the request body), so a client can't smuggle in fields like `role` even
  if it tried.
- **No SQL injection surface** — all queries go through Drizzle's
  parameterized query builder; the few raw `sql` template usages (dynamic
  `EXISTS` subqueries for team filtering) use tagged-template interpolation,
  which parameterizes automatically rather than concatenating strings.

## Auth

JWT access tokens, 7-day expiry. Protected endpoints require:

```
Authorization: Bearer <token>
```

The server **only** ever reads this header — it never reads cookies. (The
Next.js client stores the token in an httpOnly cookie and proxies it onto
this header server-side; see the client's own docs for that half of the
flow.)

## Database Schema

| Table | Purpose |
|---|---|
| `users` | accounts — `role` (user/moderator/admin), `token_version` (JWT revocation), bcrypt `password` |
| `teams` | published competitive teams |
| `teams_pokemons` | one row per Pokémon slot on a team (stats, item, ability, nature, IVs/EVs) |
| `teams_pokemons_moves` | moveset for a `teams_pokemons` row |
| `team_likes` | composite-PK like/unlike join table |
| `pokemon_analyses` | one row per Pokémon with any Community content (role/overview text) |
| `analysis_sets` | competitive movesets attached to an analysis — tracks `is_ai_draft`, `updated_by`/`updated_at` ("last edited by") |
| `analysis_revisions` | append-only audit log — powers both the Activity Timeline and the live-computed Contributors strip (no stored contributor table) |
| `analysis_proposals` | pending "suggest a set" submissions |
| `proposal_votes` | composite-PK vote join table |

Schema lives in `src/db/schema.ts`. Always change the schema there first,
then `npm run db:generate` + `npm run db:migrate` — never hand-edit a
migration file or `schema.sql`.

## API

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Create account (rate limited: 5/hour/IP). Returns the new `user` object only — **no token**. Callers must call `/auth/login` separately to get one (the Next.js client's `/api/auth/register` route does this chaining server-side so the browser never sees two round trips). |
| POST | `/auth/login` | — | Get an access token (rate limited: 10/15min/IP) |
| GET | `/auth/me` | Required | Current user, resolved from the bearer token |
| POST | `/auth/logout-all` | Required | Bump `token_version` — invalidates every token issued to this account, including the one used to call it |

### Static data (JSON-backed, no DB queries — all under `/gamedata`)
| Method | Endpoint |
|--------|----------|
| GET | `/gamedata/pokemons` |
| GET | `/gamedata/moves` |
| GET | `/gamedata/abilities` |
| GET | `/gamedata/items` |
| GET | `/gamedata/natures` |
| GET | `/gamedata/formats` |
| GET | `/gamedata/learnsets` |

### Teams
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/teams` | Optional | Browse teams with filters, paginated |
| GET | `/teams/count` | Optional | Total matching rows for the same filters (drives `totalPages`) |
| GET | `/teams/format-counts` | — | Count of published teams per format |
| GET | `/teams/:id` | — | Get a single team |
| POST | `/teams` | Required | Publish a team |
| PUT | `/teams/:id` | Required | Full team replacement (owner only) |
| DELETE | `/teams/:id` | Required | Delete a team (owner only) |
| POST | `/teams/:id/likes` | Required | Like a team (409 if already liked) |
| DELETE | `/teams/:id/likes` | Required | Unlike a team |

`GET /teams` query params: `?pokemon=&move=&ability=&item=&format=&name=&user=&liked_by=&sort=newest|oldest|popular&page=&limit=`,
plus combo filters `pokemon_item=`, `pokemon_move=`, `pokemon_ability=`,
`pokemon_nature=` (format `pokemonId:valueId`) linking a specific Pokémon to a
specific attribute. `liked_by=me` resolves from the JWT.

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/:id` | Optional | Public profile + a lean teams array |
| PATCH | `/users/:id` | Required | Update email, password, avatar, or bio (own account only). Email/password changes require `currentPassword`. A password change also revokes all other sessions (see Security). `avatar: ""` clears the avatar (distinct from omitting the field). |

### Pokémon Analyses (Community layer)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/pokemon-analyses/:pokemonId` | Optional | Full analysis: role/overview, sets, contributors, revision history, open proposals (with `hasVoted` if authenticated). Returns `null` (not 404) if nobody's contributed yet. |
| PATCH | `/pokemon-analyses/:pokemonId` | Required | Create or update the role/overview text. Creates the analysis row on first contribution. |
| POST | `/pokemon-analyses/:pokemonId/sets` | Required | Add a new competitive set |
| PATCH | `/pokemon-analyses/sets/:setId` | Required | Edit an existing set — also clears `is_ai_draft` (a human edit *is* the review step) |
| POST | `/pokemon-analyses/:pokemonId/proposals` | Required | Suggest a new/alternate set, with an optional full build |
| POST | `/pokemon-analyses/proposals/:id/votes` | Required | Upvote a proposal (409 if already voted, or if the proposal's already resolved) |
| DELETE | `/pokemon-analyses/proposals/:id/votes` | Required | Remove your vote |
| POST | `/pokemon-analyses/proposals/:id/accept` | Required + moderator/admin | Promote a proposal into a real set (atomic — only one of two concurrent accept/reject calls can win) |
| POST | `/pokemon-analyses/proposals/:id/reject` | Required + moderator/admin | Reject a proposal |

Contributors and their role label (Creator/Editor/AI draft) are computed live
from `analysis_revisions`, not stored. Only `tyranitar` has seeded content
today (`npm run seed:tyranitar`) — every other Pokémon's analysis starts
empty until someone contributes.
