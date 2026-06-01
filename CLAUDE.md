# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A community-driven Gen 4 Pokémon competitive teambuilder API. Users build and publish teams; anyone can browse and filter them. See `README.md` for the stack and `DATABASE.md` for full architectural decisions.

**Stack:** Node.js · Express · TypeScript · Drizzle ORM · Zod · JWT · PostgreSQL (local) / Neon (production) · Railway deployment

## Architecture: Static vs. Dynamic Data

The core architectural decision is a strict split between two data stores:

- **JSON files** — all immutable game data (pokémons, moves, abilities, items, natures, formats, learnsets). Served via API endpoints, cached client-side at startup, never touched again during a session.
- **PostgreSQL** — user-generated content only (accounts, teams, team configurations, likes).

JSON files are also loaded into server memory at startup so the service layer can validate requests without database queries. IDs in the database (e.g., `pokemon_id`, `move_id`) reference entries in JSON, not foreign-keyed database rows.

`formats.json` entries include `banned_moves` and `banned_items` arrays of integer IDs. These are validated server-side against each Pokémon's moves and held item when a team is published or updated.

## Validation Strategy

Validation is split between two layers with a clear rationale for each:

| What | Where | Why |
|---|---|---|
| IVs 0–31, EVs 0–252 | DB `CHECK` constraints | Native to SQL |
| Unique Pokémon per team | DB `UNIQUE (team_id, pokemon_id)` | Uniqueness constraint |
| Cascading deletes | DB `CASCADE` / `SET NULL` | Referential integrity |
| Max 4 moves, max 6 Pokémon | Zod (service) | SQL can't constrain row count |
| Total EVs ≤ 508 | Zod (service) | Cross-column sum, not a SQL `CHECK` |
| Happiness 0–255, default 255 | Zod (service) | Gen 4 range; 255 is the competitive standard |
| Pokémon/move/ability/item validity | Zod + in-memory JSON | References JSON, not a DB table |
| Ability legal for Pokémon | Service (in-memory cross-ref) | pokemon-abilities.json |
| Move in learnset | Service (in-memory cross-ref) | pokemon-moves.json |
| Pokémon legal in tier | Service (in-memory cross-ref) | pokemons.json + formats.json |
| Move not in format's banned_moves | Service (in-memory cross-ref) | formats.json |
| Item not in format's banned_items | Service (in-memory cross-ref) | formats.json |
| Level = 5 (LC) or 100 (all others) | Service (in-memory cross-ref) | Set server-side — client value is ignored |

A team in the database is by definition valid and public. **Drafts are never persisted** — they live in the client's localStorage until publication.

## Key Database Relationships

Five tables store dynamic data (`users`, `teams`, `teams_pokemons`, `teams_pokemons_moves`, `team_likes`):

- `teams.user_id → users`: **SET NULL** — teams survive user deletion, displayed as "Deleted user"
- `teams_pokemons.team_id → teams`: **CASCADE**
- `teams_pokemons_moves.teams_pokemon_id → teams_pokemons`: **CASCADE**
- `team_likes.user_id → users`: **CASCADE** — likes removed when user deletes account
- `team_likes.team_id → teams`: **CASCADE** — likes removed when team is deleted

`users` has nullable `avatar VARCHAR(255)` (profile picture URL) and `bio VARCHAR(255)`. `pseudo` is immutable after registration.

`team_likes` has `PRIMARY KEY (user_id, team_id)` — presence of a row means the user has liked the team.

The `teams_pokemons` and `teams_pokemons_moves` tables store integer IDs (not names) so that filtered queries like `GET /teams?move=89&pokemon=445` can use indexed B-tree lookups. The frontend resolves IDs to display names from its in-memory JSON cache.

Indexes exist on `teams_pokemons(pokemon_id)`, `teams_pokemons(ability_id)`, `teams_pokemons_moves(move_id)`, and `team_likes(team_id)`.

## API Surface

**Auth** (JWT access token, 7-day expiry — `Authorization: Bearer <token>`):
- `POST /auth/register`, `POST /auth/login`

**Static data** (JSON-backed, no DB queries):
- `GET /pokemons`, `/moves`, `/abilities`, `/items`, `/natures`, `/formats`, `/pokemon-moves`, `/pokemon-abilities`

**Teams**:
- `GET /teams` — browse with filters (see below)
- `POST /teams` — publish (auth required)
- `GET /teams/:id`
- `PUT /teams/:id` — full team replacement (auth, owner only)
- `DELETE /teams/:id` (auth, owner only)

**Likes**:
- `POST /teams/:id/likes` — like (auth required)
- `DELETE /teams/:id/likes` — unlike (auth required)

**Users**:
- `GET /users/:id` — public profile + teams
- `PATCH /users/:id` — update email, password, avatar, or bio (auth, own account; email/password require current password)
- `DELETE /users/:id` (auth, own account)

**`GET /teams` query params:**
`?pokemon=&move=&ability=&item=&format=&name=&user=&liked_by=&sort=newest|oldest|popular&page=&limit=`

`liked_by=me` is resolved server-side from the JWT. Team responses include `likes_count` (live COUNT from `team_likes`) and `liked` (boolean — whether the authenticated user liked this team, `null` for unauthenticated requests).

## Environment Variables

- `ASSETS_URL` — base URL for static assets (sprites, icons); nothing asset-related is stored in the database or JSON files.
- Database connection string for PostgreSQL / Neon.
- JWT secret.

## Schema Reference

The full PostgreSQL schema is in `schema.sql`. Drizzle ORM is used for migrations and queries — do not modify the database schema directly; update the Drizzle schema definition and generate migrations.
