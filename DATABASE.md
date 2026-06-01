# Database & Data Architecture

## Architecture Split

Data is split between two layers based on one criterion: **does this data change at runtime?**

**PostgreSQL** stores user-generated content — accounts, teams, team configurations, and likes. This data is dynamic, relational, and needs to support filtered queries like "show me all teams that use Earthquake."

**JSON files** store Pokémon game data — species, moves, abilities, items, natures, formats, learnsets. This data is immutable — defined by Game Freak, written once, read forever. These files have **no database representation**; integer IDs stored in PostgreSQL columns like `pokemon_id` and `move_id` reference entries in these JSON files, not foreign-keyed database rows.

```
JSON (static, immutable)          PostgreSQL (dynamic, user-generated)
├── pokemons.json                 ├── users
├── moves.json                    ├── teams
├── abilities.json                ├── teams_pokemons
├── items.json                    ├── teams_pokemons_moves
├── natures.json                  └── team_likes
├── formats.json
├── pokemon-moves.json
└── pokemon-abilities.json
```

---

## Client-Side Data Flow

All static JSON data is loaded once when the frontend app starts:

```
App startup → GET /pokemons
              GET /moves
              GET /abilities
              GET /items
              GET /natures
              GET /formats
              GET /pokemon-moves
              GET /pokemon-abilities
```

These requests fire in parallel. Once loaded, everything is cached in a client-side store. From that point on, **zero API calls are made for static data**.

When the user types "hydro" in the teambuilder search:
1. Client filters `moves` in memory → finds Hydropump (id: 56)
2. Client cross-references `pokemon-moves` in memory → finds all Pokémon that learn move 56
3. Client displays results instantly

No network request. No database query. The teambuilder is fully local.

---

## formats.json Shape

Each format entry includes the tier used for Pokémon legality checks, plus arrays of banned move and item IDs:

```json
[
  { "id": 1, "name": "Ubers", "tier": "ubers", "banned_moves": [], "banned_items": [] },
  { "id": 2, "name": "OU",    "tier": "ou",    "banned_moves": [14, 59], "banned_items": [245, 178] },
  { "id": 3, "name": "UU",    "tier": "uu",    "banned_moves": [14, 59], "banned_items": [] },
  { "id": 4, "name": "NU",    "tier": "nu",    "banned_moves": [14, 59], "banned_items": [] },
  { "id": 5, "name": "PU",    "tier": "pu",    "banned_moves": [14, 59], "banned_items": [] },
  { "id": 6, "name": "LC",    "tier": "lc",    "banned_moves": [14, 59], "banned_items": [] }
]
```

---

## Server-Side Validation

When a user publishes or updates a team (`POST /teams`, `PUT /teams/:id`), the API validates everything server-side before persisting. JSON files are loaded into server memory at startup.

| Check | Source | Method |
|-------|--------|--------|
| Pokémon exists | pokemons.json | Zod + in-memory lookup |
| Pokémon is legal in this format's tier | pokemons.json + formats.json | In-memory comparison |
| Ability belongs to this Pokémon | pokemon-abilities.json | In-memory lookup |
| Each move is in this Pokémon's learnset | pokemon-moves.json | In-memory lookup |
| Move not in format's banned_moves | formats.json | In-memory lookup |
| Item not in format's banned_items | formats.json | In-memory lookup |
| No duplicate Pokémon in the team | Request payload | Zod |
| Max 6 Pokémon per team | Request payload | Zod |
| Max 4 moves per Pokémon | Request payload | Zod |
| EVs per stat between 0–252 | Request payload | Zod + DB CHECK |
| IVs per stat between 0–31 | Request payload | Zod + DB CHECK |
| Total EVs ≤ 508 | Request payload | Zod |
| Happiness between 0–255 | Request payload | Zod |
| Level = 5 (LC) or 100 (all other formats) | formats.json | Set server-side — client value ignored |

A team in the database is by definition **valid and public**. Drafts are never persisted — they live in the client's localStorage until publication.

---

## PostgreSQL Schema

### `users`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| password | VARCHAR(60) | NOT NULL, hashed with bcrypt |
| pseudo | VARCHAR(60) | NOT NULL, UNIQUE, immutable after registration |
| avatar | VARCHAR(255) | Nullable — profile picture URL |
| bio | VARCHAR(255) | Nullable |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

### `teams`

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| name | VARCHAR(30) | NOT NULL |
| user_id | INTEGER | FK → users, **nullable**, ON DELETE SET NULL |
| format_id | INTEGER | NOT NULL — references id in formats.json, no FK constraint |
| description | TEXT | |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP |

`user_id` is nullable so that teams survive user deletion. When a user deletes their account, their teams remain with `user_id = NULL` and the frontend displays "Deleted user."

`format_id` references an id in `formats.json`. Validated by the service before insertion.

### `teams_pokemons`

Each row is a specific Pokémon in a specific team with its full competitive configuration.

| Column | Type | Constraints |
|--------|------|-------------|
| id | SERIAL | PRIMARY KEY |
| team_id | INTEGER | NOT NULL, FK → teams, ON DELETE CASCADE |
| pokemon_id | INTEGER | NOT NULL — references id in pokemons.json |
| ability_id | INTEGER | NOT NULL — references id in abilities.json |
| nature_id | INTEGER | NOT NULL — references id in natures.json |
| item_id | INTEGER | Nullable — references id in items.json |
| level | INTEGER | NOT NULL — set server-side: 5 for LC, 100 for all others |
| gender | gender ENUM | NOT NULL (male, female, random, genderless) |
| shiny | BOOLEAN | NOT NULL |
| happiness | INTEGER | NOT NULL, DEFAULT 255 |
| nickname | VARCHAR(12) | Nullable |
| iv_hp … iv_speed | INTEGER | NOT NULL, CHECK (0–31) |
| ev_hp … ev_speed | INTEGER | NOT NULL, CHECK (0–252) |

- **UNIQUE (team_id, pokemon_id)** — a Pokémon can only appear once per team
- **ON DELETE CASCADE on team_id** — deleting a team deletes all its Pokémon configurations

`pokemon_id`, `ability_id`, `nature_id`, and `item_id` reference ids in their respective JSON files. All validated by the service layer against in-memory JSON before insertion.

### `teams_pokemons_moves`

| Column | Type | Constraints |
|--------|------|-------------|
| teams_pokemon_id | INTEGER | NOT NULL, FK → teams_pokemons, ON DELETE CASCADE |
| move_id | INTEGER | NOT NULL — references id in moves.json |

- **PRIMARY KEY (teams_pokemon_id, move_id)** — a move can only appear once per Pokémon
- **ON DELETE CASCADE on teams_pokemon_id** — deleting a team Pokémon deletes its moves

### `team_likes`

| Column | Type | Constraints |
|--------|------|-------------|
| user_id | INTEGER | NOT NULL, FK → users, ON DELETE CASCADE |
| team_id | INTEGER | NOT NULL, FK → teams, ON DELETE CASCADE |

- **PRIMARY KEY (user_id, team_id)** — a user can only like a team once; presence of a row = liked

---

## Indexes

```sql
CREATE INDEX ON teams_pokemons (pokemon_id);
CREATE INDEX ON teams_pokemons (ability_id);
CREATE INDEX ON teams_pokemons_moves (move_id);
CREATE INDEX ON team_likes (team_id);
```

The first three support filtered team queries. The `team_likes(team_id)` index supports the live COUNT used by `?sort=popular`.

---

## Delete Behavior

| Relationship | Strategy | Effect |
|---|---|---|
| teams.user_id → users | SET NULL | Teams survive user deletion, shown as "Deleted user" |
| teams_pokemons.team_id → teams | CASCADE | Deleting a team removes all its Pokémon |
| teams_pokemons_moves.teams_pokemon_id → teams_pokemons | CASCADE | Deleting a team Pokémon removes its moves |
| team_likes.user_id → users | CASCADE | Likes are removed when a user deletes their account |
| team_likes.team_id → teams | CASCADE | Likes are removed when a team is deleted |

---

## Database vs. Service Enforcement

| Constraint | Enforced by | Why not the other |
|---|---|---|
| IVs 0–31 | Database CHECK | Simple range, native to SQL |
| EVs 0–252 | Database CHECK | Same |
| Unique Pokémon per team | Database UNIQUE | Uniqueness constraint, native to SQL |
| Unique move per Pokémon | Database PK | Composite primary key handles this |
| Unique like per user per team | Database PK | Composite primary key handles this |
| Cascading deletes | Database CASCADE / SET NULL | Referential actions, native to SQL |
| Max 4 moves per Pokémon | Service (Zod) | SQL cannot constrain row count |
| Max 6 Pokémon per team | Service (Zod) | Same |
| Total EVs ≤ 508 | Service (Zod) | Cross-column sum not expressible as CHECK |
| Happiness 0–255 | Service (Zod) | Simple range validated before DB insert |
| Pokémon / ability / move / item exists | Service (Zod) | References JSON, not a DB table |
| Ability legal for Pokémon | Service | Cross-reference against pokemon-abilities.json |
| Move in learnset | Service | Cross-reference against pokemon-moves.json |
| Pokémon legal in tier | Service | Cross-reference against pokemons.json + formats.json |
| Move not banned in format | Service | Cross-reference against formats.json banned_moves |
| Item not banned in format | Service | Cross-reference against formats.json banned_items |
| Level correct for format | Service | Set server-side from formats.json — client value ignored |

---

## Filtered Team Queries

`teams_pokemons` and `teams_pokemons_moves` store integer IDs to enable filtered queries on community teams.

Example: `GET /teams?move=89&pokemon=445&ability=33&item=22&format=ou&name=rain&user=42&sort=popular&page=1&limit=20`

```sql
SELECT DISTINCT teams.*,
  (SELECT COUNT(*) FROM team_likes WHERE team_id = teams.id) AS likes_count,
  (EXISTS (SELECT 1 FROM team_likes WHERE team_id = teams.id AND user_id = $currentUserId)) AS liked
FROM teams
JOIN teams_pokemons ON teams.id = teams_pokemons.team_id
JOIN teams_pokemons_moves ON teams_pokemons.id = teams_pokemons_moves.teams_pokemon_id
WHERE teams_pokemons.pokemon_id = 445
  AND teams_pokemons_moves.move_id = 89
  AND teams.name ILIKE '%rain%'
ORDER BY likes_count DESC
LIMIT 20 OFFSET 0
```

The database filters on integers. The frontend translates IDs to display names using its in-memory JSON cache — `445` → Garchomp, `89` → Earthquake.

**Supported query parameters:**

| Parameter | Description |
|---|---|
| `pokemon` | Filter by Pokémon ID |
| `move` | Filter by move ID |
| `ability` | Filter by ability ID |
| `item` | Filter by item ID |
| `format` | Filter by format ID |
| `name` | Search team name (case-insensitive substring) |
| `user` | Filter by user ID |
| `liked_by` | Filter teams liked by a user ID; pass `me` to resolve from JWT |
| `sort` | `newest` (default), `oldest`, `popular` |
| `page` | Page number, default 1 |
| `limit` | Results per page, default 20, max 100 |

**Team response shape** includes `likes_count` (live COUNT from `team_likes`) and `liked` (boolean — whether the authenticated user has liked the team, `null` for unauthenticated requests).

---

## Static Assets

Static assets (sprites, icons, images) are served from a dedicated server.
No asset data is stored in the database or JSON files.

Base URL is defined by the `ASSETS_URL` environment variable.
