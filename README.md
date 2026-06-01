# Pokémon Teambuilder API

A community-driven Gen 4 Pokémon teambuilder. Users build competitive teams and share them publicly. Anyone can browse and filter community teams.

## Stack

- **Runtime** — Node.js
- **Framework** — Express
- **Language** — TypeScript
- **ORM** — Drizzle
- **Validation** — Zod
- **Auth** — JWT
- **Database** — PostgreSQL (local) / Neon (production)
- **Deployment** — Railway + Neon

## Architecture

This project separates static game data (Pokémon, moves, abilities, learnsets) from dynamic user data (accounts, teams, likes). Static data lives in JSON files and is cached client-side at startup for instant filtering. Dynamic data lives in PostgreSQL.

See [DATABASE.md](./DATABASE.md) for a full breakdown of every architectural decision.

## Auth

JWT access tokens, 7-day expiry. Protected endpoints require:

```
Authorization: Bearer <token>
```

## API

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | — | Create account |
| POST | `/auth/login` | — | Get access token |

### Static data (JSON-backed, cached client-side)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/pokemons` | All Pokémon |
| GET | `/moves` | All moves |
| GET | `/abilities` | All abilities |
| GET | `/items` | All held items |
| GET | `/natures` | All natures |
| GET | `/formats` | All competitive formats |
| GET | `/pokemon-moves` | Pokémon learnsets |
| GET | `/pokemon-abilities` | Pokémon ability pools |

### Teams
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/teams` | Optional | Browse teams with filters |
| POST | `/teams` | Required | Publish a team |
| GET | `/teams/:id` | Optional | Get a single team |
| PUT | `/teams/:id` | Required | Full team replacement (owner only) |
| DELETE | `/teams/:id` | Required | Delete a team (owner only) |

`GET /teams` supports: `?pokemon=`, `?move=`, `?ability=`, `?item=`, `?format=`, `?name=`, `?user=`, `?liked_by=`, `?sort=newest|oldest|popular`, `?page=`, `?limit=`

### Likes
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/teams/:id/likes` | Required | Like a team |
| DELETE | `/teams/:id/likes` | Required | Unlike a team |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/users/:id` | — | Public profile + teams |
| PATCH | `/users/:id` | Required | Update email, password, avatar, or bio |
| DELETE | `/users/:id` | Required | Delete account |
