import pokemonsJson from "../data/json/pokemons.json";
import formats from "../data/json/formats.json";
import learnsetsJson from "../data/json/learnsets.json";
import movesJson from "../data/json/moves.json";
import natures from "../data/json/natures.json";
import items from "../data/json/items.json";
import { createTeamSchema } from "../schemas/team";
import z from "zod";
import { Pokemon } from "../types";
import abilitiesJson from "../data/json/abilities.json";

const pokemonList = pokemonsJson as Pokemon[];
const abilitiesList = abilitiesJson as { id: number; name: string; description: string }[];

type TeamData = z.infer<typeof createTeamSchema>;
type ValidationResult = { valid: true; level: number } | { valid: false; error: string };

const TIER_ORDER = ["lc", "pu", "nu", "uu", "ou", "ubers"];

function getPokemonLearnset(pokemonId: number): number[] {
  const visited = new Set<number>();
  const moves = new Set<number>();
  let currentId: number | null = pokemonId;

  while (currentId !== null && !visited.has(currentId)) {
    visited.add(currentId);
    const entry = (learnsetsJson as { pokemonId: number; moves: number[] }[]).find(
      (l) => l.pokemonId === currentId
    );
    if (entry) entry.moves.forEach((m) => moves.add(m));
    const pokemon = pokemonList.find((p) => p.id === currentId);
    currentId = pokemon?.evolvesFrom ?? null;
  }

  return Array.from(moves);
}

export function validateTeam(data: TeamData): ValidationResult {
  const format = formats.find((f) => f.id === data.formatId);
  if (!format) {
    return { valid: false, error: "Invalid format" };
  }

  const formatTierIndex = TIER_ORDER.indexOf(format.tier);
  const level = format.tier === "lc" ? 5 : 100;

  for (const pokemon of data.pokemons) {
    const pokemonData = pokemonList.find((p) => p.id === pokemon.pokemonId);
    if (!pokemonData) {
      return { valid: false, error: `Pokemon ${pokemon.pokemonId} does not exist` };
    }

    // Tier legality
    const pokemonTierIndex = TIER_ORDER.indexOf(pokemonData.tier);
    if (pokemonTierIndex > formatTierIndex) {
      return {
        valid: false,
        error: `${pokemonData.name} is not allowed in ${format.name}`,
      };
    }

    // Ability
    if (!pokemonData.abilities.includes(pokemon.abilityId)) {
      return {
        valid: false,
        error: `${pokemonData.name} cannot have ability ${abilitiesList.find(
          (a) => a.id === pokemon.abilityId
        )?.name}`,
      };
    }

    // Nature
    const nature = natures.find((n) => n.id === pokemon.natureId);
    if (!nature) {
      return { valid: false, error: `Nature ${pokemon.natureId} does not exist` };
    }

    // Item
    if (pokemon.itemId !== undefined) {
      const item = items.find((i) => i.id === pokemon.itemId);
      if (!item) {
        return { valid: false, error: `Item ${pokemon.itemId} does not exist` };
      }
      if ((format.banned_items as number[]).includes(pokemon.itemId)) {
        return {
          valid: false,
          error: `${item.name} is banned in ${format.name}`,
        };
      }
    }

    // Moves
    const learnset = getPokemonLearnset(pokemon.pokemonId);
    const moveList = movesJson as { id: number; name: string }[];
    for (const moveId of pokemon.moves) {
      const duplicates = pokemon.moves.filter(m => m === moveId);
      if (duplicates.length > 1) {
        const move = moveList.find(m => m.id === moveId);
        return {
          valid: false,
          error: `${pokemonData.name} cannot have multiple copies of ${move?.name ?? `move ${moveId}`}`,
        };
      }
    }
    for (const moveId of pokemon.moves) {
      const move = (movesJson as { id: number; name: string }[]).find((m) => m.id === moveId);
      if (!move) {
        return { valid: false, error: `Move ${moveId} does not exist` };
      }
      if (!learnset.includes(moveId)) {
        return {
          valid: false,
          error: `${pokemonData.name} cannot learn ${move.name}`,
        };
      }
      if ((format.banned_moves as number[]).includes(moveId)) {
        return {
          valid: false,
          error: `${move.name} is banned in ${format.name}`,
        };
      }
    }
  }

  return { valid: true, level };
}
