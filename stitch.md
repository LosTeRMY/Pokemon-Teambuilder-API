# Stitch Design Brief — Pokémon Teambuilder

Paste this file as context when starting a new page in Stitch.

---

## Project Overview

A community-driven **Gen 4 Pokémon competitive teambuilder**. Users build competitive teams and publish them publicly. Anyone can browse, filter, and like community teams.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Components:** Generate as React functional components with Tailwind classes
- **No external UI libraries** — pure Tailwind only

---

## Pages to Design

| Page | Route |
|---|---|
| Team browser | `/` |
| Team detail | `/teams/[id]` |
| Create team | `/teams/new` |
| Edit team | `/teams/[id]/edit` |
| User profile | `/users/[id]` |
| Login | `/login` |
| Register | `/register` |

---

## Data Shapes

### Team (list view — from GET /teams)
```ts
{
  id: number
  name: string           // max 30 chars
  description: string | null
  userId: number | null  // null = "Deleted user"
  format_id: number      // references Format
  createdAt: string      // ISO date
  likes_count: number
  liked: boolean | null  // null if not logged in
}
```

### Team (detail view — from GET /teams/:id)
```ts
{
  id: number
  name: string
  description: string | null
  userId: number | null
  format_id: number
  createdAt: string
  pokemons: [         // always exactly 6
    {
      id: number
      pokemon_id: number      // look up name from pokemons data
      ability_id: number      // look up name from abilities data
      nature_id: number       // look up name from natures data
      item_id: number | null  // look up name from items data
      level: number           // 5 (Little Cup) or 100
      gender: "male" | "female" | "random" | "genderless"
      shiny: boolean
      happiness: number       // 0–255
      nickname: string | null // max 12 chars
      moves: number[]         // 1–4 move IDs, look up names from moves data
      iv_hp, iv_atk, iv_def, iv_sp_atk, iv_sp_def, iv_speed: number  // 0–31
      ev_hp, ev_atk, ev_def, ev_sp_atk, ev_sp_def, ev_speed: number  // 0–252
    }
  ]
}
```

### User (from GET /users/:id)
```ts
{
  id: number
  username: string
  avatar: string | null  // URL
  bio: string | null     // max 255 chars
  createdAt: string
  teams: Team[]          // same shape as list view
}
```

### Format (from data/formats.json)
```ts
{
  id: number
  name: string   // e.g. "OU", "Ubers", "Little Cup"
  tier: string   // "ou" | "ubers" | "uu" | "nu" | "pu" | "lc"
}
```

### Pokémon (from data/pokemons.json)
```ts
{
  id: number
  name: string
  types: string[]          // e.g. ["Dragon", "Ground"]
  tier: string
  abilities: number[]      // ability IDs
  evolvesFrom: number | null
  genderType: string
  baseStats: {
    hp: number
    atk: number
    def: number
    spa: number
    spd: number
    spe: number
  }
}
```

### Move (from data/moves.json)
```ts
{ id: number; name: string }
```

### Ability (from data/abilities.json)
```ts
{ id: number; name: string; description: string }
```

### Item (from data/items.json)
```ts
{ id: number; name: string }
```

### Nature (from data/natures.json)
```ts
{ id: number; name: string }
```

---

## Filters (GET /teams query params)

| Param | Type | Description |
|---|---|---|
| `pokemon` | number ID | filter by Pokémon on the team |
| `move` | number ID | filter by move |
| `ability` | number ID | filter by ability |
| `item` | number ID | filter by held item |
| `format` | number ID | filter by format |
| `name` | string | search team name (partial match) |
| `user` | number ID | filter by author |
| `liked_by` | number ID or `"me"` | filter by who liked |
| `sort` | `"newest"` \| `"oldest"` \| `"popular"` | sort order |
| `page` | number | pagination (default 1) |
| `limit` | number | results per page (default 20, max 100) |

---

## Auth State

- Logged-in users have a username, id, and avatar (optional)
- `liked` on a team is `boolean` when logged in, `null` when not
- `userId: null` on a team means the author deleted their account — display as "Deleted user"

---

## Design Direction

- **Theme:** Light, clean — white/off-white background with blue accents. Modern and airy.
- **Type colors:** Each Pokémon type has its own color (Fire = orange-red, Water = blue, etc.)
- **Dense but readable** — teams have a lot of data; keep it compact without feeling cluttered
- **Gen 4 Pokémon names and icons** — no forms beyond Gen 4 Sinnoh Pokédex
