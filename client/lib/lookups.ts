import { GAMEDATA } from './gameData';
import type { GBPokemon, GBMove, GBAbility, GBItem, GBNature } from './gameData';

export const slug = (name: string) =>
  name.toLowerCase().replace(/[''.:]/g, '').replace(/\s+/g, '').replace(/[^a-z0-9-]/g, '');

function byName<T extends { id: number; name: string }>(arr: T[]) {
  const m = new Map<string, number>();
  arr.forEach((x) => m.set(x.name.toLowerCase(), x.id));
  return m;
}

function byId<T extends { id: number }>(arr: T[]) {
  const m = new Map<number, T>();
  arr.forEach((x) => m.set(x.id, x));
  return m;
}

export const pokeByName = byName(GAMEDATA.pokemons);
export const moveByName = byName(GAMEDATA.moves);
export const abilByName = byName(GAMEDATA.abilities);
export const itemByName = byName(GAMEDATA.items);
export const natByName  = byName(GAMEDATA.natures);

export const pokeById = byId(GAMEDATA.pokemons);
export const moveById = byId(GAMEDATA.moves);
export const abilById = byId(GAMEDATA.abilities);
export const itemById = byId(GAMEDATA.items);
export const natById  = byId(GAMEDATA.natures);
export const fmtById  = byId(GAMEDATA.formats);

const sortByName = <T extends { name: string }>(a: T, b: T) => a.name.localeCompare(b.name);

export const opts = {
  pokemons:  [...GAMEDATA.pokemons].sort(sortByName) as GBPokemon[],
  moves:     [...GAMEDATA.moves].sort(sortByName) as GBMove[],
  abilities: [...GAMEDATA.abilities].sort(sortByName) as GBAbility[],
  items:     [...GAMEDATA.items].sort(sortByName) as GBItem[],
  natures:   [...GAMEDATA.natures].sort(sortByName) as GBNature[],
};

export const movesForPokemon = (pid: number): GBMove[] => {
  const ids = GAMEDATA.learnsets[pid];
  if (!ids?.length) return opts.moves;
  return ids.map((id) => moveById.get(id)).filter((m): m is GBMove => Boolean(m)).sort(sortByName);
};

export const abilitiesForPokemon = (pid: number): GBAbility[] => {
  const p = pokeById.get(pid);
  if (!p?.abilities?.length) return opts.abilities;
  return p.abilities.map((id) => abilById.get(id)).filter((a): a is GBAbility => Boolean(a)).sort(sortByName);
};

export type Combo = { pid: number; vid: number; kind: 'move' | 'item' | 'ability' | 'nature' };

export type FilterState = {
  name: string;
  format: number | null;
  pokemon: number[];
  move: number[];
  ability: number[];
  item: number[];
  combos: Combo[];
  likedBy: boolean;
  sort: 'newest' | 'oldest' | 'popular';
  page: number;
};

const comboParam: Record<Combo['kind'], string> = {
  move: 'pokemon_move', item: 'pokemon_item', ability: 'pokemon_ability', nature: 'pokemon_nature',
};
const comboKindOf: Record<string, Combo['kind']> = {
  pokemon_move: 'move', pokemon_item: 'item', pokemon_ability: 'ability', pokemon_nature: 'nature',
};

export function encode(state: FilterState): string {
  const p = new URLSearchParams();
  if (state.name) p.set('name', state.name);
  if (state.format != null) p.set('format', String(state.format));
  state.pokemon.forEach((id) => p.append('pokemon', String(id)));
  state.move.forEach((id) => p.append('move', String(id)));
  state.ability.forEach((id) => p.append('ability', String(id)));
  state.item.forEach((id) => p.append('item', String(id)));
  state.combos.forEach((c) => p.append(comboParam[c.kind], `${c.pid}:${c.vid}`));
  if (state.likedBy) p.set('liked_by', 'me');
  if (state.sort !== 'newest') p.set('sort', state.sort);
  if (state.page > 1) p.set('page', String(state.page));
  return p.toString();
}

export function decode(search: string): Partial<FilterState> {
  const p = new URLSearchParams(search);
  const ints = (k: string) =>
    p.getAll(k).map((v) => parseInt(v, 10)).filter((n) => Number.isInteger(n) && !isNaN(n));
  const combos: Combo[] = [];
  Object.keys(comboKindOf).forEach((param) => {
    p.getAll(param).forEach((raw) => {
      const [a, b] = String(raw).split(':');
      const pid = parseInt(a, 10), vid = parseInt(b, 10);
      if (Number.isInteger(pid) && !isNaN(pid) && Number.isInteger(vid) && !isNaN(vid))
        combos.push({ pid, vid, kind: comboKindOf[param] });
    });
  });
  const fmtRaw = parseInt(p.get('format') ?? '', 10);
  const sortRaw = p.get('sort');
  return {
    name: p.get('name') || '',
    format: !isNaN(fmtRaw) ? fmtRaw : null,
    pokemon: ints('pokemon'),
    move: ints('move'),
    ability: ints('ability'),
    item: ints('item'),
    combos,
    likedBy: p.get('liked_by') === 'me',
    sort: (sortRaw === 'oldest' || sortRaw === 'popular') ? sortRaw : 'newest',
    page: parseInt(p.get('page') ?? '', 10) > 1 ? parseInt(p.get('page') ?? '', 10) : 1,
  };
}
