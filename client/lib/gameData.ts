import pokemonsData from '../data/pokemons.json';
import movesData from '../data/moves.json';
import abilitiesData from '../data/abilities.json';
import itemsData from '../data/items.json';
import naturesData from '../data/natures.json';
import formatsData from '../data/formats.json';
import learnsetsData from '../data/learnsets.json';

export type GBPokemon = { id: number; name: string; types: string[]; tier: string; abilities: number[] };
export type GBMove = { id: number; name: string };
export type GBAbility = { id: number; name: string };
export type GBItem = { id: number; name: string };
export type GBNature = { id: number; name: string };
export type GBFormat = { id: number; name: string; tier: string };

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
