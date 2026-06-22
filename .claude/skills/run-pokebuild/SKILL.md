---
name: run-pokebuild
description: Build, run, and drive PokéBuild (the Next.js client + Express server in this repo). Use when asked to start the app, run the client and server together, take a screenshot of a page, or click through/verify a UI change in a real browser.
---

PokéBuild is two independent Node apps (`client/` Next.js on :3000, `server/`
Express on :3001, see root `CLAUDE.md`) that must run together for anything
client-side to work. There's no `chromium-cli` in this container, so drive the
browser with `.claude/skills/run-pokebuild/driver.mjs` — a small stdin-piped
script with the same nav/click/fill/screenshot vocabulary.

All paths below are relative to the repo root.

## Prerequisites

No OS packages needed — this is a pure Node project, no native/GUI deps. The
driver needs a Chromium binary for Playwright; one was already present in
this container at `~/AppData/Local/ms-playwright/chromium-1228` (verified by
launching it). On a machine without it:

```bash
cd .claude/skills/run-pokebuild && npm install && npx playwright install chromium
```

## Setup

```bash
cd server && npm install
cd ../client && npm install
```

Both apps need env files (not committed — create them yourself):

`server/.env`:
```env
DATABASE_URL=postgresql://...   # Postgres connection string (local or Neon)
JWT_SECRET=...                  # any secret string
PORT=3001
CLIENT_ORIGIN=http://localhost:3000
```

`client/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

If the database is brand new, apply migrations from `server/`:

```bash
npm run db:migrate
```

Tyranitar is the only Pokémon with seeded Community-feature content
(`server/scripts/seed-tyranitar.ts`); without running it, every Pokédex
analysis page will legitimately show empty sets/community sections — that's
the real, by-design empty state, not a bug. Seed it (idempotent — safe to
re-run):

```bash
cd server && npm run seed:tyranitar
```

## Build

No separate build step for driving the app — both `npm run dev` commands
below compile on demand (`tsx watch`, Next dev). `npm run build` exists in
each (`tsc` / `next build`) but isn't needed for this workflow.

## Run (agent path)

Start both apps (skip whichever port already responds — don't kill a server
you didn't start; check first):

```bash
curl -sf http://localhost:3001/health || (cd server && PORT=3001 npm run dev &)
curl -sf http://localhost:3000 || (cd client && npm run dev &)
timeout 30 bash -c 'until curl -sf http://localhost:3001/health >/dev/null; do sleep 1; done'
timeout 30 bash -c 'until curl -sf http://localhost:3000 >/dev/null; do sleep 1; done'
```

Install the driver's own dependencies once (isolated `package.json` in this
skill dir — never touches `client/`'s or `server/`'s lockfile):

```bash
cd .claude/skills/run-pokebuild && npm install
```

Drive it by piping commands to stdin:

```bash
cd .claude/skills/run-pokebuild && node driver.mjs <<'EOF'
nav http://localhost:3000/pokedex/tyranitar
wait-for text=Competitive movesets
screenshot tyranitar
console-errors
end
EOF
```

Screenshots land in `.claude/skills/run-pokebuild/screenshots/` (gitignored —
verification artifacts, not committed).

| command | what it does |
|---|---|
| `nav <url>` | navigate, waits for network idle |
| `wait-for <css-selector>` or `wait-for text=<text>` | wait up to 15s for a match |
| `wait-url-not <substring>` | wait until the URL no longer contains substring (use after a submit that redirects — see Gotchas) |
| `click <css-selector>`, `click text=<text>`, `click button:has-text("...")` | click the first match |
| `fill <css-selector> <value...>` | fill an input (selector first, rest of line is the value) |
| `press <key>` | e.g. `press Escape` |
| `wait <ms>` | fixed pause, use sparingly |
| `screenshot [name]` | full-page PNG |
| `screenshot-element <css-selector>` | crop to one element, e.g. `screenshot-element [role=dialog]` for a modal |
| `console-errors` | dumps collected `console.error`/`pageerror` events so far |
| `login <email> <password>` | drives the real `/login` form, waits for the post-login redirect |
| `register <username> <email> <password>` | drives `/register`, waits for the post-register redirect (slow — see Gotchas) |
| `quit` / `end` | closes the browser, exits |

## Run (human path)

```bash
cd server && PORT=3001 npm run dev      # terminal 1
cd client && npm run dev                # terminal 2 — open http://localhost:3000
```
Ctrl-C each terminal to stop.

## Test

No test runner is configured in either app (`server`'s `npm test` just exits
1; `client` has no test script at all — confirmed in both `package.json`s).
There's nothing to run here beyond this driver.

---

## Gotchas

- **`register`/`login` are slow — don't use `networkidle` after submit.** The
  register route does bcrypt (cost 12) *and* an internal register-then-login
  double request (see `client/app/api/auth/register/route.ts`); the whole
  round trip is ~8s. `networkidle` can resolve before the redirect actually
  happens, so the driver's `register`/`login` commands explicitly
  `waitForURL` for the path to change instead — do the same in custom scripts
  (`wait-url-not register` / `wait-url-not login`), don't poll for idle.
- **Login/register inputs have no `name` attribute, only `id`.** Selectors
  must be `#email` / `#username` / `#password`, not `input[name="email"]`
  (confirmed by inspecting the rendered form — `client/app/login/page.tsx` and
  `client/app/register/page.tsx` only set `id`).
- **Auth is an httpOnly cookie, not visible to client JS** (see root
  `CLAUDE.md` "Auth Architecture"). Don't try to set/read a token cookie
  directly from a script — always go through the real `/login` or
  `/register` form like the `login`/`register` driver commands do, or the
  session won't actually be attached to subsequent requests.
- **Most Pokémon pages show empty Community sections — that's correct.** Only
  `tyranitar` has seeded content. Don't mistake "No competitive movesets
  documented yet" / "No community activity yet" on any other slug for a bug.
- **Check ports before launching.** This container often already has both
  dev servers running from a previous session (`tsx watch` / `next dev`
  auto-reload on file changes) — starting a second one on the same port
  fails with `EADDRINUSE` for the server or auto-bumps to :3002 for the
  Next.js client, silently breaking the assumption that the client is on
  :3000. Always `curl` the port first.

## Troubleshooting

- **`browserType.launch: Executable doesn't exist at ...chromium...`**: the
  Chromium binary isn't installed for this Playwright version. Run
  `npx playwright install chromium` from inside this skill directory (after
  `npm install` there).
- **`register`/`login` driver command throws a Playwright timeout waiting
  for the URL to change**: check `server/.env`'s `CLIENT_ORIGIN` matches the
  client's actual origin — a mismatch makes `cors()` reject the credentialed
  request and the form just sits there with no visible error.
- **Next.js client comes up on :3002 instead of :3001/:3000**: it auto-bumps
  the port when :3000 is already bound by something else (confirmed this
  message appears: `Port 3000 is in use ... using available port 3002
  instead`). Free :3000 first or explicitly hit whatever port it printed.
