# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · TanStack Query 5 · App Router

## Commands

```bash
npm run dev    # Turbopack dev server (default port 3000)
npm run build  # production build
npm run start  # run production build
npm run lint   # ESLint
```

Run with the API URL pointed at the server:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev
```

## Environment Variables

```text
NEXT_PUBLIC_API_URL=   # Express API base URL (no trailing slash)
```

## Data

`client/data/` is a **physical copy** of `data/` at the repo root — Turbopack cannot follow junctions outside the project root. Keep them in sync when editing any JSON file.

Sprites are served from `public/sprites/gen4/<slug>.png`. Slug format is produced by `lib/lookups.ts#slug()`.

## Pages

| Route | File | Status |
|---|---|---|
| `/` | `app/page.tsx` | Team browser — FilterSidebar + TeamsBrowser/TeamDisplay |
| `/pokedex` | `app/pokedex/page.tsx` | Pokédex grid with search, tier, type, and sort filters |
| `/pokedex/[slug]` | `app/pokedex/[slug]/page.tsx` | Per-Pokémon analysis page (stats, sets, usage, community) |
| `/builder` | `app/builder/page.tsx` | Team builder — species/item/ability/move/EV-IV editor, drafts persisted to `localStorage` |

`app/builder/Teambuilder v2 (offline).html` and `app/offline delete later/Pokémon Analysis v2 (offline).html` are Stitch AI design-export mockups kept for reference — scratch files, not part of the runtime app.

## Component Architecture

```text
components/
  FilterSidebar/      # filter rail: format picker, multi-selects, combo builder
    index.tsx         # drawer/rail wrapper
    FilterRail.tsx    # desktop sidebar layout
    FormatPicker.tsx  # single-select format dropdown
    MultiFilter.tsx   # add-by-autocomplete list (pokemon/move/ability/item)
    ComboGroup.tsx    # renders existing combo chips
    ComboBuilder.tsx  # two-step Pokémon→attribute combo picker
  TeamsBrowser/       # right-hand team grid on `/`
    TeamDisplay.tsx   # toolbar (sort, count, view controls) + card grid
    TeamCard.tsx      # single team card with like button and meta
    MonSlot.tsx       # one Pokémon slot inside a team card
    SummaryPills.tsx  # type/format summary chips on a card
  Analysis/           # per-Pokémon analysis page (`/pokedex/[slug]`)
    Hero.tsx          # header: sprite, types, role, usage rate
    BaseStats.tsx     # base stat bars
    AbilityCard.tsx   # ability list with descriptions
    DefenseCard.tsx   # type-effectiveness chart for the Pokémon's typing
    SetCard.tsx       # summary card for one competitive set
    SetDrawer.tsx     # full-detail slide-over for a set (also reused for proposals)
    UsageDashboard.tsx   # ladder usage stats: items/moves/teammates/spreads
    CommunitySection.tsx # contributors, revision history, set proposals
    ActivityTimeline.tsx # revision history list
    AiReviewList.tsx     # AI-authored content pending human review
    ProposalsList.tsx    # pending "suggest a new set" proposals
  TeamBuilder/        # team builder page (`/builder`)
    Sidebar.tsx        # "My teams" rail/drawer: search, draft/published filter, team cards
    TeamListCard.tsx    # one saved-team card in the sidebar
    WorkArea.tsx        # header (name/format/save/publish/export), member grid + editor split
    MemberTile.tsx      # one team slot summary; AddTile.tsx for empty slots
    Editor.tsx          # per-member editor shell (sprite, nickname, gender/shiny, notes)
    ItemPicker.tsx / AbilityPicker.tsx / NaturePicker.tsx / MovesEditor.tsx / EvIvEditor.tsx
                        # field-level pickers/editors used inside Editor.tsx
    NotesTab.tsx        # role tags + free-text notes per member
    SpeciesPicker.tsx   # modal: search/pick a Pokémon to add or swap into a slot
    Modal.tsx / ExportModal.tsx # generic modal shell + Showdown-format export
  ui/                 # primitive reusable components
    AutoComplete.tsx  # text input with filtered dropdown
    Chip.tsx          # dismissible filter chip
    Input.tsx         # styled input wrapper
    Label.tsx         # form label
    PokeToken.tsx     # sprite + name inline token
    TierBadge.tsx     # colored tier (LC/PU/.../Ubers) pill
    TypeBadge.tsx     # colored Pokémon-type pill
  Navbar.tsx          # top nav with theme toggle and links
```

## Lib / Hooks Architecture

```text
lib/
  gameData.ts     # GAMEDATA singleton: typed wrappers around JSON imports;
                  # learnsets.json reshaped from [{pokemonId, moves}] to Record<id, id[]>
  lookups.ts      # name↔ID Maps built from GAMEDATA; FilterState type; pokeBySlug;
                  # abilitiesForPokemon(); encode()/decode() for URL↔state serialization
  browserUtils.ts # display helpers: tier/type colors, relDate(), avatarColor(), fmtName()
  dex-sort.ts     # weightedDexSort() — tier-weighted "featured" ordering for the Pokédex
  typeChart.ts    # Gen 1–5 (pre-Fairy) type effectiveness chart — the version that applies
                  # to Gen 4 DPP (Steel still resists Ghost/Dark)
  mockData.ts     # spriteUrl() helper only now — the curated TEAMS data it used to export
                  # was removed once useTeamBrowser switched to GET /teams
  cn.ts           # re-exports `clsx` as `cn`
  teamBuilder.ts  # DraftTeam/DraftMember types (incl. serverId), stat calc, Showdown export,
                  # localStorage load/save (with runtime shape validation)
  api.ts          # apiFetch() — the one place client code calls the Express API, routed
                  # through app/api/proxy/ (see root CLAUDE.md "Auth Architecture")
  sessionCookie.ts   # httpOnly cookie get/set/clear helpers shared by app/api/auth/* routes
  teamBrowserMap.ts  # GET /teams row -> BrowserTeam/BrowserMember (display shape for TeamCard/MonSlot)
  teamPublishMap.ts  # DraftTeam <-> POST/PUT /teams payload, incl. gender enum and EV/IV key remap

hooks/
  useFilterState.ts  # FilterState + URL sync; exposes add/remove helpers and activeCount
  useTeamBrowser.ts  # composes theme + filter state + GET /teams via TanStack Query; server
                     # does all filtering/sorting (see teamBrowserMap.ts)
  useTeamBuilder.ts  # owns builder page state: saved/working teams, selection, modals, toast;
                     # reconciles local drafts with server-published teams (GET /teams?user=<id>),
                     # local copy wins when both exist; publishTeam() calls POST/PUT /teams
  useAuth.ts         # TanStack Query wrapper around app/api/auth/* — { user, login, register, logout }
  useTheme.ts        # reads/writes localStorage "pb-theme"; sets data-theme on <html>
```

## Current Limitations (important before adding features)

- **Analysis content**: `app/pokedex/[slug]/data.ts` hand-curates `ANALYSIS_BY_SLUG` (sets, usage stats, community activity) — none of it comes from real game data or an API. Only the `tyranitar` slug has an entry today; every other slug 404s via `notFound()` until more are curated.
- **Builder's "Save" vs "Publish"**: `saveTeam()` always upserts the open team into the local list regardless of whether it's published — this is intentional, not a bug. `useTeamBuilder`'s `savedTeams` merges that local list with `GET /teams?user=<id>` by `serverId`, and the local copy always wins when both exist, so an in-progress edit on a published team survives a refresh without waiting on a server round trip.

## Styling

Tailwind v4 utility classes bound to a CSS custom property token set in `app/globals.css` — not hand-written CSS per component. Color tokens (`--accent`, `--surface`, `--ink`, etc.) are defined in `:root` (light) and `[data-theme="dark"]` blocks, then re-exposed as `--color-*` in an `@theme` block so they're usable as ordinary Tailwind utilities (`bg-surface`, `text-ink`, `border-line`, ...). Theme toggle adds `theme-switching` class to `<html>` for 80 ms to suppress transition flicker. Reach for a Tailwind utility first; only add to the "Residual CSS" section at the bottom of `globals.css` for things utilities genuinely can't express — `color-mix()` with a dynamic custom property (see `.fchip`, `.tier-badge`, `.ai-flag`), `text-wrap: pretty` (`.an-prose`, `.card-desc`), pseudo-elements, or parent/child selectors.
