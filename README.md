# Pokémon Teambuilder API

A community-driven Gen 4 Pokémon teambuilder. Users build competitive teams and share them publicly. Anyone can browse and filter community teams.

## Stack (subject to change)

- **Runtime** — Node.js
- **Framework** — Express
- **Language** — TypeScript
- **ORM** — Drizzle
- **Validation** — Zod
- **Auth** — JWT
- **Database** — PostgreSQL (local) / Neon (production)
- **Deployment** — Railway + Neon

## Architecture

This project separates static game data (Pokémon, moves, abilities, learnsets) from dynamic user data (accounts, teams). Static data lives in JSON files and is cached client-side at startup for instant filtering. Dynamic data lives in PostgreSQL.

See [DATABASE.md](./DATABASE.md) for a full breakdown of every architectural decision.
