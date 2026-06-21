// One-time/occasionally-rerun tool: pulls real Gen 4 ladder usage stats from
// Smogon's public "chaos" stats archive (smogon.com/stats) and writes them to
// data/usage-stats.json (+ a synced copy in client/data/, see root CLAUDE.md).
//
// Smogon publishes one chaos JSON per format per month. gen4ou has a fresh
// file every month; gen4ubers/uu/nu/pu/lc only get ladder activity sporadically
// (some months go a year+ without one), so each tier searches backward for its
// own latest available month — staleness varies a lot by tier, and that's
// expected, not a bug.
//
// Run with: npm run fetch:usage-stats
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const DATA_DIR = path.join(REPO_ROOT, "data");
const CLIENT_DATA_DIR = path.join(REPO_ROOT, "client/data");

const STATS_BASE = "https://www.smogon.com/stats";
const TIER_FORMAT = { ubers: "gen4ubers", ou: "gen4ou", uu: "gen4uu", nu: "gen4nu", pu: "gen4pu", lc: "gen4lc" };
const CUTOFFS = [1760, 1630, 1500, 0]; // highest first
const MIN_BATTLES = 200; // fall back to a lower cutoff if the high-cutoff sample is too thin
const MAX_MONTHS_BACK = 72;
const FETCH_TIMEOUT_MS = 15_000;

// Bounds every request so one stalled connection can't hang the whole script —
// findLatestMonth() makes dozens of these probing for the right month.
async function fetchWithTimeout(url, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const TIER_LABEL = { ubers: "Ubers", ou: "OU", uu: "UU", nu: "NU", pu: "PU", lc: "LC" };

// Mirrors client/lib/lookups.ts#slug — keep in sync.
const slug = (name) =>
  name.toLowerCase().replace(/['’.:]/g, "").replace(/\s+/g, "").replace(/[^a-z0-9-]/g, "");

// Smogon's chaos JSON keys items/abilities/moves by a fully-collapsed id
// (lowercase, punctuation and spaces stripped) — e.g. "Lum Berry" -> "lumberry".
const smogonId = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, "");

// A handful of Gen 4 form names Smogon abbreviates differently than data/pokemons.json.
const SPECIES_ALIASES = {
  "Giratina-O": "Giratina-Origin",
  "Shaymin-S": "Shaymin-Sky",
  "Wormadam-G": "Wormadam",
  "Wormadam-S": "Wormadam-Sandy",
  "Wormadam-T": "Wormadam-Trash",
  "Deoxys-A": "Deoxys-Attack",
  "Deoxys-D": "Deoxys-Defense",
  "Deoxys-S": "Deoxys-Speed",
};

function monthString(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Network hiccups here just mean "treat this month as unavailable and keep
// searching" — never let a transient failure abort the whole script.
async function urlExists(url) {
  try {
    const res = await fetchWithTimeout(url, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchJson(url) {
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

// Walks backward from the current month until it finds one where this
// format's chaos stats exist at all (checked via the always-present -0 file).
async function findLatestMonth(format) {
  const cursor = new Date();
  cursor.setUTCDate(1);
  for (let i = 0; i < MAX_MONTHS_BACK; i++) {
    const month = monthString(cursor);
    const url = `${STATS_BASE}/${month}/chaos/${format}-0.json`;
    if (await urlExists(url)) return month;
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
  }
  return null;
}

// Among the four rating-cutoff files for a month, picks the highest cutoff
// with a sample size worth using, falling back toward -0 for thin tiers.
async function fetchBestCutoff(format, month) {
  for (const cutoff of CUTOFFS) {
    const url = `${STATS_BASE}/${month}/chaos/${format}-${cutoff}.json`;
    let json;
    try {
      json = await fetchJson(url);
    } catch {
      continue;
    }
    if (cutoff === 0 || json.info["number of battles"] >= MIN_BATTLES) {
      return { json, cutoff };
    }
  }
  return null;
}

function pctMap(counts) {
  const sum = Object.values(counts).reduce((a, b) => a + b, 0);
  if (sum <= 0) return [];
  return Object.entries(counts)
    .map(([id, count]) => ({ id, pct: (count / sum) * 100 }))
    .sort((a, b) => b.pct - a.pct);
}

function formatSpread(natureName, evs, natureByName) {
  const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"];
  const STAT_LABEL = { hp: "HP", atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe" };
  const nature = natureByName.get(natureName);
  const parts = [];
  STAT_KEYS.forEach((key, i) => {
    const v = evs[i];
    if (v === 0) return;
    let suffix = "";
    if (nature?.boostedStat === key) suffix = "+";
    else if (nature?.reducedStat === key) suffix = "-";
    parts.push(`${v} ${STAT_LABEL[key]}${suffix}`);
  });
  return parts.join(" / ");
}

// Builds the UI-shaped Usage object (see client/app/pokedex/[slug]/data.ts)
// for one Pokémon's chaos-stats entry, dropping any item/ability/move/spread
// row that doesn't resolve against real game data rather than guessing.
function buildUsage(mon, tier, entry, month, lookups) {
  const { itemBySmogonId, abilityBySmogonId, moveById, natureByName, resolveSpecies } = lookups;
  const rate = entry.usage * 100;

  const abilityRows = pctMap(entry.Abilities)
    .map((r) => ({ name: abilityBySmogonId.get(r.id), pct: r.pct }))
    .filter((r) => r.name);

  const itemRows = pctMap(entry.Items)
    .map((r) => ({ name: itemBySmogonId.get(r.id), pct: r.pct }))
    .filter((r) => r.name)
    .slice(0, 8);

  const moveRows = pctMap(entry.Moves)
    .map((r) => { const mv = moveById.get(r.id); return mv && { name: mv.name, type: mv.type, pct: r.pct }; })
    .filter(Boolean)
    .slice(0, 12);

  const teammateRows = pctMap(entry.Teammates)
    .map((r) => { const tm = resolveSpecies(r.id); return tm && { name: tm.name, slug: slug(tm.name), pct: r.pct }; })
    .filter(Boolean)
    .slice(0, 10);

  const spreadCounts = {};
  for (const [key, count] of Object.entries(entry.Spreads)) {
    const [natureName, evString] = key.split(":");
    const evs = evString.split("/").map(Number);
    const label = formatSpread(natureName, evs, natureByName);
    if (label) spreadCounts[label] = (spreadCounts[label] ?? 0) + count;
  }
  const spreads = pctMap(spreadCounts)
    .slice(0, 6)
    .map((r) => ({ spread: r.id, pct: r.pct }));

  return {
    rate,
    blurb: `${rate.toFixed(1)}% of Gen 4 ${TIER_LABEL[tier]} teams used ${mon.name} (Smogon ladder stats, ${month}).`,
    abilities: abilityRows,
    items: itemRows,
    moves: moveRows,
    teammates: teammateRows,
    spreads,
  };
}

async function main() {
  const [pokemons, items, abilities, moves, natures] = await Promise.all(
    ["pokemons.json", "items.json", "abilities.json", "moves.json", "natures.json"].map((f) =>
      readFile(path.join(DATA_DIR, f), "utf8").then(JSON.parse),
    ),
  );

  const itemBySmogonId = new Map(items.map((i) => [smogonId(i.name), i.name]));
  const abilityBySmogonId = new Map(abilities.map((a) => [smogonId(a.name), a.name]));
  const moveById = new Map(moves.map((m) => [smogonId(m.name), { name: m.name, type: m.type }]));
  const natureByName = new Map(natures.map((n) => [n.name, n]));

  const pokemonBySlug = new Map(pokemons.map((p) => [slug(p.name), p]));
  const pokemonByName = new Map(pokemons.map((p) => [p.name, p]));
  function resolveSpecies(name) {
    const aliased = SPECIES_ALIASES[name] ?? name;
    return pokemonByName.get(aliased) ?? pokemonBySlug.get(slug(aliased)) ?? null;
  }

  const sources = {};
  const byId = {};
  const unresolved = new Set();

  for (const [tier, format] of Object.entries(TIER_FORMAT)) {
    console.log(`\n[${tier}] searching for latest ${format} stats…`);
    const month = await findLatestMonth(format);
    if (!month) {
      console.log(`[${tier}] no chaos stats found in the last ${MAX_MONTHS_BACK} months — skipping.`);
      continue;
    }
    const result = await fetchBestCutoff(format, month);
    if (!result) {
      console.log(`[${tier}] found month ${month} but couldn't load any cutoff file — skipping.`);
      continue;
    }
    const { json, cutoff } = result;
    sources[tier] = { month, cutoff, battles: json.info["number of battles"] };
    console.log(`[${tier}] using ${month} (cutoff ${cutoff}, ${json.info["number of battles"]} battles, ${Object.keys(json.data).length} mons)`);

    for (const [speciesName, entry] of Object.entries(json.data)) {
      const mon = resolveSpecies(speciesName);
      if (!mon) { unresolved.add(speciesName); continue; }
      // Only keep this entry if it's the Pokémon's own canonical tier — avoids
      // a mon picking up conflicting stats from a tier it isn't actually slotted into.
      if (mon.tier !== tier) continue;

      byId[mon.id] = buildUsage(mon, tier, entry, month, {
        itemBySmogonId, abilityBySmogonId, moveById, natureByName, resolveSpecies,
      });
    }
  }

  if (unresolved.size) {
    console.log(`\n${unresolved.size} species names didn't resolve to a Pokémon (skipped):`);
    console.log([...unresolved].sort().join(", "));
  }

  const out = { generated: new Date().toISOString(), sources, byId };
  await writeFile(path.join(DATA_DIR, "usage-stats.json"), JSON.stringify(out, null, 2) + "\n");
  await writeFile(path.join(CLIENT_DATA_DIR, "usage-stats.json"), JSON.stringify(out, null, 2) + "\n");
  console.log(`\nWrote usage stats for ${Object.keys(byId).length} Pokémon.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
