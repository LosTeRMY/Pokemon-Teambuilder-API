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

Held-item icons are served from `public/sprites/items/<slug>.png` (same slug convention). They're sliced once from Pokémon Showdown's `itemicons-sheet.png` via `npm run fetch:item-sprites` (`scripts/fetch-item-sprites.mjs`) — idempotent (skips files that already exist), keyed against Showdown's server-side `data/items.ts` `spritenum` field (fetched and parsed as plain text, never executed). `sharp` is a devDependency scoped to this one script; it isn't part of the app bundle. A handful of item names may not resolve a `spritenum` — those items just keep showing `components/ui/ItemIcon.tsx`'s colored-letter-square fallback (also used while an icon is loading, or if its file 404s).

## Pages

| Route | File | Status |
|---|---|---|
| `/` | `app/page.tsx` | Team browser — FilterSidebar + TeamsBrowser/TeamDisplay |
| `/pokedex` | `app/pokedex/page.tsx` | Pokédex grid with search, tier, type, and sort filters |
| `/pokedex/[slug]` | `app/pokedex/[slug]/page.tsx` | Per-Pokémon analysis page (stats, sets, usage, community) |
| `/builder` | `app/builder/page.tsx` | Team builder — species/item/ability/move/EV-IV editor, drafts persisted to `localStorage` |
| `/profile/[id]` | `app/profile/[id]/page.tsx` | Public profile — any user's avatar/bio/stats + published teams (GET `/users/:id` + GET `/teams?user=`) |
| `/profile/settings` | `app/profile/settings/page.tsx` | Own-account editor — profile/email/password forms (PATCH `/users/:id`); redirects to `/login` if signed out |

`app/profile/Account Settings (offline).html` and `app/profile/User Profile (offline).html` are Stitch AI design-export mockups kept intentionally as the pixel-reference for `/profile/[id]` and `/profile/settings` — unlike the `/builder` mockup (deleted once that page shipped), **do not delete these**.

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
    TeamDisplay.tsx   # toolbar (sort, count, view controls) + card grid + Pager
    TeamCard.tsx      # single team card with like button and meta
    MonSlot.tsx       # one Pokémon slot inside a team card
    SummaryPills.tsx  # type/format summary chips on a card
    Pager.tsx         # prev/next + "page X of Y", server-paginated (PAGE_SIZE=20)
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
    Modal.tsx / ExportModal.tsx / DeleteTeamModal.tsx
                        # generic modal shell + Showdown-format export + delete confirmation
                        # (only published teams route through DeleteTeamModal; drafts delete instantly)
  Profile/            # public profile (`/profile/[id]`) + account settings (`/profile/settings`)
    ProfileHeader.tsx   # avatar, username, bio, "Member since", Edit-profile link (own profile only)
    ProfileStats.tsx    # teams-published / likes-received counters
    ProfileTeamList.tsx # "Published teams" card: client-side sort (newest/oldest/popular) + rows
    ProfileTeamRow.tsx  # one team row: tier badge, name, small MonSlot row, like toggle, relDate
    ProfileForm.tsx     # avatar URL + bio editor -> PATCH /users/:id
    EmailForm.tsx       # email + currentPassword -> PATCH /users/:id
    PasswordForm.tsx    # new/confirm/current password -> PATCH /users/:id
  ui/                 # primitive reusable components
    AutoComplete.tsx  # text input with filtered dropdown
    Avatar.tsx        # hosted avatar <img> with onError fallback to the initial-letter token
    Chip.tsx          # dismissible filter chip
    Input.tsx         # styled input wrapper
    ItemIcon.tsx      # held-item sprite (see "Data" section) + colored-letter-square
                      # fallback (also exported as ItemFallback), mirrors PokeToken's fade-in
    Label.tsx         # form label
    PokeToken.tsx     # sprite + name inline token
    TierBadge.tsx     # colored tier (LC/PU/.../Ubers) pill
    Toast.tsx         # bottom-center success toast, shared by the builder and account settings pages
    TypeBadge.tsx     # colored Pokémon-type pill
  Navbar.tsx          # top nav with theme toggle, links, settings shortcut, and profile avatar link
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
  useFilterState.ts  # FilterState + URL sync; exposes add/remove helpers and activeCount;
                     # any filter mutation resets page to 1 (only the pager itself sets page)
  useTeamBrowser.ts  # composes theme + filter state + GET /teams via TanStack Query; server
                     # does all filtering/sorting (see teamBrowserMap.ts); paginates client-side
                     # state against GET /teams/count (PAGE_SIZE=20) for totalPages; likes are
                     # applied as an optimistic cache update, rolled back on request failure
  useTeamBuilder.ts  # owns builder page state: saved/working teams, selection, modals, toast;
                     # reconciles local drafts with server-published teams (GET /teams?user=<id>),
                     # local copy wins when both exist; publishTeam() calls POST/PUT /teams;
                     # requestDelete() deletes drafts instantly but routes published teams through
                     # pendingDeleteId + DeleteTeamModal (cancelDelete/confirmDelete) since that
                     # delete hits DELETE /teams/:id and can't be undone
  useAuth.ts         # TanStack Query wrapper around app/api/auth/* — { user, login, register, logout };
                     # AuthUser includes createdAt (used by the settings page's "Member since")
  useTheme.ts        # reads/writes localStorage "pb-theme"; sets data-theme on <html>
  useLikeToggle.ts   # shared optimistic like/unlike-with-rollback for a BrowserTeam[] query key —
                     # used by useTeamBrowser and useUserProfile so the two don't duplicate the logic
  useUserProfile.ts  # GET /users/:id (header metadata) + GET /teams?user=<id> (full team rows via
                     # teamBrowserMap, reused rather than the lean `teams` array /users/:id embeds);
                     # sort is client-side (the list is one user's teams, never paginated)
  useAccountSettings.ts # three independent forms (profile/email/password), each its own
                     # pending/error state, all funnel into one toast — same id-tracked notify()
                     # pattern as useTeamBuilder. Profile saves always send the current avatar URL
                     # field value, so clearing it to "" and saving is how a user removes their avatar
```

## Current Limitations (important before adding features)

- **Analysis content**: `app/pokedex/[slug]/data.ts` hand-curates `ANALYSIS_BY_SLUG` (sets, usage stats, community activity) — none of it comes from real game data or an API. Only the `tyranitar` slug has an entry today; every other slug 404s via `notFound()` until more are curated.
- **Builder's "Save" vs "Publish"**: `saveTeam()` always upserts the open team into the local list regardless of whether it's published — this is intentional, not a bug. `useTeamBuilder`'s `savedTeams` merges that local list with `GET /teams?user=<id>` by `serverId`, and the local copy always wins when both exist, so an in-progress edit on a published team survives a refresh without waiting on a server round trip.
- **Profile page has no team detail link**: rows in `ProfileTeamList` aren't clickable — there's no `/teams/:id` page yet, matching the team browser's own cards (also non-navigational).
- **Two static placeholders on the profile/settings pages**: the "permanent" badge next to a username (`ProfileHeader`, and the summary card in `app/profile/settings/page.tsx`) and the "Pokédex pages" row in `ProfileStats` are hardcoded — there's no account-tier column on `users` and no wiki-edit-tracking table, so every profile shows the same `28` / `142 edits`. They exist purely to match the Stitch mockup pixel-for-pixel; wire them to real columns/tables before this ships.

## Styling

Tailwind v4 utility classes bound to a CSS custom property token set in `app/globals.css` — not hand-written CSS per component. Color tokens (`--accent`, `--surface`, `--ink`, etc.) are defined in `:root` (light) and `[data-theme="dark"]` blocks, then re-exposed as `--color-*` in an `@theme` block so they're usable as ordinary Tailwind utilities (`bg-surface`, `text-ink`, `border-line`, ...). Theme toggle adds `theme-switching` class to `<html>` for 80 ms to suppress transition flicker. Reach for a Tailwind utility first; only add to the "Residual CSS" section at the bottom of `globals.css` for things utilities genuinely can't express — `color-mix()` with a dynamic custom property (see `.fchip`, `.tier-badge`, `.ai-flag`), `text-wrap: pretty` (`.an-prose`, `.card-desc`), pseudo-elements, or parent/child selectors.
