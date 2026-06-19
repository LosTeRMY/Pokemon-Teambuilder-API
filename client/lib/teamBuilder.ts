/* teamBuilder.ts — draft-team domain logic for the /builder page. Drafts are
 * never sent to the server (see root CLAUDE.md "Draft Teams") — everything
 * here is pure client-side state shaping, stat math, and localStorage I/O. */
import { GAMEDATA } from "./gameData";
import type { GBPokemon, GBNature } from "./gameData";
import * as LK from "./lookups";

export type StatKey = "hp" | "atk" | "def" | "spa" | "spd" | "spe";
export type StatSpread = Record<StatKey, number>;
export type Gender = "M" | "F" | "N";

export const STAT_ORDER: StatKey[] = ["hp", "atk", "def", "spa", "spd", "spe"];
export const STAT_LABEL: Record<StatKey, string> = {
  hp: "HP", atk: "Atk", def: "Def", spa: "SpA", spd: "SpD", spe: "Spe",
};
/* Builder-specific tier palette for the sidebar's team-card format badge —
 * intentionally distinct from TierBadge.tsx's TIER_HUE (the Pokédex's palette);
 * this is the exact palette the Stitch mockup used for tb2-tcard. */
export const TIER_COLOR: Record<string, string> = {
  ubers: "#b3446a", ou: "#2f6fe0", uu: "#2f9a5a", nu: "#d98a2b", pu: "#6b7688", lc: "#e0682a",
};
export function fmtColor(formatId: number | null): string {
  const tier = formatId != null ? LK.fmtById.get(formatId)?.tier : undefined;
  return (tier && TIER_COLOR[tier]) || "var(--accent)";
}

export const EV_BUDGET = 510;
export const EV_MAX = 252;
export const IV_MAX = 31;
export const DEFAULT_LEVEL = 100;
export const DEFAULT_HAPPINESS = 255;

export const ROLES = [
  "Lead", "Sweeper", "Wallbreaker", "Wall", "Tank", "Pivot",
  "Cleric", "Hazard setter", "Hazard control", "Revenge killer", "Win condition", "Support",
] as const;

export type DraftNotes = { roles: string[]; text: string };

export type DraftMember = {
  uid: string;
  pid: number;
  nickname: string;
  gender: Gender;
  shiny: boolean;
  itemId: number | null;
  abilityId: number | null;
  natureId: number | null;
  moveIds: (number | null)[];
  evs: StatSpread;
  ivs: StatSpread;
  happiness: number;
  level: number;
  notes: DraftNotes;
};

export type DraftTeam = {
  id: string;
  name: string;
  formatId: number | null;
  published: boolean;
  strategy: string;
  members: (DraftMember | null)[];
};

export const blankEvs = (): StatSpread => ({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });
export const fullIvs = (): StatSpread => ({ hp: IV_MAX, atk: IV_MAX, def: IV_MAX, spa: IV_MAX, spd: IV_MAX, spe: IV_MAX });

/* "252 Atk / 252 Spe" style summary — top 3 non-zero EVs, or "No EVs". */
export function evSummary(evs: StatSpread): string {
  const parts = STAT_ORDER
    .filter((k) => evs[k] > 0)
    .sort((a, b) => evs[b] - evs[a])
    .slice(0, 3)
    .map((k) => `${evs[k]} ${STAT_LABEL[k]}`);
  return parts.length ? parts.join(" / ") : "No EVs";
}

/* Real genderType values seen in data/pokemons.json: "both" | "genderless" | "none". */
export function genderOptions(genderType: string): Gender[] {
  if (genderType === "genderless" || genderType === "none") return ["N"];
  return ["M", "F"];
}

function natureMultiplier(stat: StatKey, nature: GBNature | undefined): number {
  if (!nature) return 1;
  if (nature.boostedStat === stat) return 1.1;
  if (nature.reducedStat === stat) return 0.9;
  return 1;
}

/* Standard Gen 3+ stat formula. */
export function calcStat(
  stat: StatKey, base: number, iv: number, ev: number, natureId: number | null, level: number,
): number {
  const nature = natureId != null ? LK.natById.get(natureId) : undefined;
  if (stat === "hp") {
    if (base === 1) return 1; // Shedinja-style fixed HP (no Gen 4 mons here, but keep the rule honest)
    return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
  }
  const flat = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
  return Math.floor(flat * natureMultiplier(stat, nature));
}

export function calcAllStats(
  base: StatSpread, ivs: StatSpread, evs: StatSpread, natureId: number | null, level: number,
): StatSpread {
  const out = blankEvs();
  STAT_ORDER.forEach((k) => { out[k] = calcStat(k, base[k], ivs[k], evs[k], natureId, level); });
  return out;
}

const TIER_ORDER = ["lc", "pu", "nu", "uu", "ou", "ubers"];

/* Same hierarchy as server/src/services/teamValidation.ts — a Pokémon is legal
 * in a format if its own tier sits at or below the format's tier. */
export function isTierLegal(pokemonTier: string, formatTier: string): boolean {
  const pi = TIER_ORDER.indexOf(pokemonTier);
  const fi = TIER_ORDER.indexOf(formatTier);
  if (pi === -1 || fi === -1) return true; // unknown tier — don't block on a data gap
  return pi <= fi;
}

export function createBlankMember(pokemon: GBPokemon): DraftMember {
  return {
    uid: `m${Date.now()}${Math.random().toString(36).slice(2, 7)}`,
    pid: pokemon.id,
    nickname: "",
    gender: genderOptions(pokemon.genderType)[0],
    shiny: false,
    itemId: null,
    abilityId: pokemon.abilities[0] ?? null,
    natureId: null,
    moveIds: [null, null, null, null],
    evs: blankEvs(),
    ivs: fullIvs(),
    happiness: DEFAULT_HAPPINESS,
    level: DEFAULT_LEVEL,
    notes: { roles: [], text: "" },
  };
}

export function createBlankTeam(): DraftTeam {
  return {
    id: `u${Date.now()}`,
    name: "New team",
    formatId: GAMEDATA.formats[0]?.id ?? null,
    published: false,
    strategy: "",
    members: [null, null, null, null, null, null],
  };
}

/* Drops any member whose pid no longer resolves to a real Pokémon (e.g. stale
 * localStorage from before a game-data update) back to an empty slot, so a
 * draft loaded from storage degrades to "missing Pokémon" instead of being
 * silently unrenderable by every component that looks the member up. */
export function sanitizeTeam(team: DraftTeam): DraftTeam {
  return {
    ...team,
    members: team.members.map((m) => (m && LK.pokeById.get(m.pid) ? m : null)),
  };
}

/* Pokémon Showdown text export format. */
export function exportShowdown(team: DraftTeam): string {
  return team.members
    .filter((m): m is DraftMember => m != null)
    .map((m) => {
      const mon = LK.pokeById.get(m.pid);
      if (!mon) return "";
      const item = m.itemId != null ? LK.itemById.get(m.itemId) : null;
      const ability = m.abilityId != null ? LK.abilById.get(m.abilityId) : null;
      const nature = m.natureId != null ? LK.natById.get(m.natureId) : null;

      const nameLine = [
        m.nickname ? `${m.nickname} (${mon.name})` : mon.name,
        m.gender !== "N" ? `(${m.gender})` : "",
        item ? `@ ${item.name}` : "",
      ].filter(Boolean).join(" ");

      const lines: string[] = [nameLine];
      if (ability) lines.push(`Ability: ${ability.name}`);
      if (m.level !== DEFAULT_LEVEL) lines.push(`Level: ${m.level}`);
      if (m.shiny) lines.push("Shiny: Yes");
      const evParts = STAT_ORDER.filter((k) => m.evs[k] > 0).map((k) => `${m.evs[k]} ${STAT_LABEL[k]}`);
      if (evParts.length) lines.push(`EVs: ${evParts.join(" / ")}`);
      if (nature) lines.push(`${nature.name} Nature`);
      const ivParts = STAT_ORDER.filter((k) => m.ivs[k] !== IV_MAX).map((k) => `${m.ivs[k]} ${STAT_LABEL[k]}`);
      if (ivParts.length) lines.push(`IVs: ${ivParts.join(" / ")}`);
      m.moveIds.forEach((id) => {
        const move = id != null ? LK.moveById.get(id) : null;
        if (move) lines.push(`- ${move.name}`);
      });
      return lines.join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

const STORAGE_KEY = "pb-builder-state-v1";

/* savedTeams is the committed list shown in the sidebar; workingTeam is
 * whatever's currently open in the editor (possibly with unsaved edits) —
 * persisting both together means a reload doesn't lose in-progress work. */
export type BuilderStorage = { savedTeams: DraftTeam[]; workingTeam: DraftTeam };

/* Minimal structural check — enough to catch corrupted/unrelated JSON before
 * it reaches .map/.filter calls downstream, without re-validating every field
 * (sanitizeTeam() already drops members with stale/invalid pids). */
function isBuilderStorage(x: unknown): x is BuilderStorage {
  if (!x || typeof x !== "object") return false;
  const obj = x as Record<string, unknown>;
  return (
    Array.isArray(obj.savedTeams) &&
    !!obj.workingTeam &&
    typeof obj.workingTeam === "object" &&
    Array.isArray((obj.workingTeam as Record<string, unknown>).members)
  );
}

export function loadBuilderState(): BuilderStorage | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isBuilderStorage(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveBuilderState(state: BuilderStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* sandboxed or storage full — drafts just won't persist this session */
  }
}
