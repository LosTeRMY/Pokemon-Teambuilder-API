/* typeChart.ts — Gen 1–5 (pre-Fairy) type effectiveness chart, the version that
 * applies to Gen 4 DPP. Steel still resists Ghost and Dark here (that changed
 * in Gen 6 when Fairy was introduced and Steel lost those resistances).
 * TYPE_CHART is attacker -> defender -> multiplier (only non-1x entries). */

export const ALL_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
  "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel",
] as const;

export type PokeType = (typeof ALL_TYPES)[number];

const TYPE_CHART: Record<PokeType, Partial<Record<PokeType, number>>> = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5, steel: 0.5 },
  dragon:   { dragon: 2, steel: 0.5 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, steel: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5 },
};

/* Multiplier received by a Pokémon with the given 1–2 types from each
 * attacking type — e.g. defenseProfile(["rock","dark"]).fighting === 4. */
export function defenseProfile(types: string[]): Record<PokeType, number> {
  const result = {} as Record<PokeType, number>;
  for (const atk of ALL_TYPES) {
    let mult = 1;
    for (const def of types) mult *= TYPE_CHART[atk]?.[def as PokeType] ?? 1;
    result[atk] = mult;
  }
  return result;
}
