/* lookups.ts — builds ID-keyed lookup maps from GAMEDATA and serializes filter
 * state to/from the URL query string exactly as the REST API expects. */
import { GAMEDATA } from "./gameData";
import type { GBPokemon, GBMove, GBAbility, GBItem, GBNature } from "./gameData";
import type { RawMember, RawTeam } from "./mockData";

export const slug = (name: string) =>
  name.toLowerCase().replace(/['’.:]/g, "").replace(/\s+/g, "").replace(/[^a-z0-9-]/g, "");

function byId<T extends { id: number }>(arr: T[]) {
  const m = new Map<number, T>();
  arr.forEach((x) => m.set(x.id, x));
  return m;
}

// Reverse of slug() — resolves a sprite/URL slug (e.g. from curated content
// like handles/threats lists) back to its real GAMEDATA Pokémon.
export const pokeBySlug = new Map<string, GBPokemon>(GAMEDATA.pokemons.map((p) => [slug(p.name), p]));

export const pokeById = byId(GAMEDATA.pokemons);
export const moveById = byId(GAMEDATA.moves);
export const abilById = byId(GAMEDATA.abilities);
export const itemById = byId(GAMEDATA.items);
export const natById = byId(GAMEDATA.natures);
export const fmtById = byId(GAMEDATA.formats);

/* A team member with both display fields (raw) and resolved canonical IDs.
 * Built by client/lib/teamBrowserMap.ts from GET /teams rows. */
export type BrowserMember = RawMember & {
  pid: number | null;
  moveIds: number[];
  abilId: number | null;
  itemId: number | null;
  natId: number | null;
};
export type BrowserTeam = Omit<RawTeam, "members"> & { members: BrowserMember[] };

/* Option lists for the autocompletes (sorted by name). */
const sortByName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);
export const opts = {
  pokemons: [...GAMEDATA.pokemons].sort(sortByName) as GBPokemon[],
  moves: [...GAMEDATA.moves].sort(sortByName) as GBMove[],
  abilities: [...GAMEDATA.abilities].sort(sortByName) as GBAbility[],
  items: [...GAMEDATA.items].sort(sortByName) as GBItem[],
  natures: [...GAMEDATA.natures].sort(sortByName) as GBNature[],
};

/* Moves a given Pokémon can legally learn (constrains the combo move picker).
 * Walks the evolvesFrom chain so an evolved Pokémon also gets moves it inherited
 * from its pre-evolutions — mirrors server/src/services/teamValidation.ts#getPokemonLearnset. */
export const movesForPokemon = (pid: number): GBMove[] => {
  const visited = new Set<number>();
  const ids = new Set<number>();
  let currentId: number | null = pid;
  while (currentId !== null && !visited.has(currentId)) {
    visited.add(currentId);
    (GAMEDATA.learnsets[currentId] || []).forEach((id) => ids.add(id));
    currentId = pokeById.get(currentId)?.evolvesFrom ?? null;
  }
  return Array.from(ids).map((id) => moveById.get(id)).filter((m): m is GBMove => Boolean(m)).sort(sortByName);
};
/* Abilities a given Pokémon can have. */
export const abilitiesForPokemon = (pid: number): GBAbility[] => {
  const p = pokeById.get(pid);
  if (!p || !p.abilities || !p.abilities.length) return [];
  return p.abilities.map((id) => abilById.get(id)).filter((a): a is GBAbility => Boolean(a)).sort(sortByName);
};

export type ComboKind = "move" | "item" | "ability" | "nature";
export type Combo = { pid: number; vid: number; kind: ComboKind };

export type FilterState = {
  name: string;
  format: number | null;
  pokemon: number[];
  move: number[];
  ability: number[];
  item: number[];
  combos: Combo[];
  likedBy: boolean;
  sort: "newest" | "oldest" | "popular";
  page: number;
};

const comboParam: Record<ComboKind, string> = {
  move: "pokemon_move", item: "pokemon_item", ability: "pokemon_ability", nature: "pokemon_nature",
};
const comboKindOf: Record<string, ComboKind> = {
  pokemon_move: "move", pokemon_item: "item", pokemon_ability: "ability", pokemon_nature: "nature",
};

/* ---- URL <-> state ---- */
export function encode(state: FilterState): string {
  const p = new URLSearchParams();
  if (state.name) p.set("name", state.name);
  if (state.format != null) p.set("format", String(state.format));
  state.pokemon.forEach((id) => p.append("pokemon", String(id)));
  state.move.forEach((id) => p.append("move", String(id)));
  state.ability.forEach((id) => p.append("ability", String(id)));
  state.item.forEach((id) => p.append("item", String(id)));
  state.combos.forEach((c) => p.append(comboParam[c.kind], c.pid + ":" + c.vid));
  if (state.likedBy) p.set("liked_by", "me");
  if (state.sort && state.sort !== "newest") p.set("sort", state.sort);
  if (state.page && state.page > 1) p.set("page", String(state.page));
  return p.toString();
}

export function decode(search: string): Partial<FilterState> {
  const p = new URLSearchParams(search);
  const ints = (k: string) => p.getAll(k).map((v) => parseInt(v, 10)).filter((n) => Number.isInteger(n));
  const combos: Combo[] = [];
  Object.keys(comboKindOf).forEach((param) => {
    p.getAll(param).forEach((raw) => {
      const [a, b] = String(raw).split(":");
      const pid = parseInt(a, 10), vid = parseInt(b, 10);
      if (Number.isInteger(pid) && Number.isInteger(vid)) // invalid pairs silently ignored
        combos.push({ pid, vid, kind: comboKindOf[param] });
    });
  });
  const fmt = parseInt(p.get("format") ?? "", 10);
  const sortRaw = p.get("sort");
  const pageRaw = parseInt(p.get("page") ?? "", 10);
  return {
    name: p.get("name") || "",
    format: Number.isInteger(fmt) ? fmt : null,
    pokemon: ints("pokemon"),
    move: ints("move"),
    ability: ints("ability"),
    item: ints("item"),
    combos,
    likedBy: p.get("liked_by") === "me",
    sort: sortRaw === "oldest" || sortRaw === "popular" ? sortRaw : "newest",
    page: pageRaw > 1 ? pageRaw : 1,
  };
}
