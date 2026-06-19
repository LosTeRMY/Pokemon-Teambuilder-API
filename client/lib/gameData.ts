/* GAMEDATA — trimmed view of the API's /gamedata/* endpoints, imported from the
 * shared root data at build time. Real integer IDs; the UI resolves names<->IDs
 * against this (see lookups.ts). */
import pokemonsData from "../data/pokemons.json";
import movesData from "../data/moves.json";
import abilitiesData from "../data/abilities.json";
import itemsData from "../data/items.json";
import naturesData from "../data/natures.json";
import formatsData from "../data/formats.json";
import learnsetsData from "../data/learnsets.json";

export type GBPokemon = {
  id: number;
  name: string;
  types: string[];
  tier: string;
  abilities: number[];
  dexNum?: number;
  genderType: "both" | "genderless" | "none";
  evolvesFrom: number | null;
  baseStats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
};
export type GBMove = {
  id: number;
  name: string;
  type: string;
  category: "physical" | "special" | "status";
  power: number | null;
  accuracy: number | null;
  pp: number;
  description: string;
};
export type GBAbility = { id: number; name: string; description: string };
export type GBItem = { id: number; name: string; description: string };
export type GBNature = { id: number; name: string; boostedStat: string | null; reducedStat: string | null };
export type GBFormat = { id: number; name: string; tier: string; banned_moves: number[]; banned_items: number[] };

/* learnsets.json is [{ pokemonId, moves }]; reshape into a pokemonId -> moveIds map. */
const learnsets: Record<number, number[]> = {};
(learnsetsData as Array<{ pokemonId: number; moves: number[] }>).forEach((ls) => {
  learnsets[ls.pokemonId] = ls.moves;
});

export const GAMEDATA = {
  pokemons: pokemonsData as GBPokemon[],
  moves: movesData as GBMove[],
  abilities: abilitiesData as GBAbility[],
  items: itemsData as GBItem[],
  natures: naturesData as GBNature[],
  formats: formatsData as GBFormat[],
  learnsets,
};
