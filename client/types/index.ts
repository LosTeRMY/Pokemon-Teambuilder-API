export type TeamListItem = {
  id: number;
  name: string;
  description: string | null;
  userId: number | null;
  format_id: number;
  createdAt: string;
  likes_count: number;
  liked: boolean | null;
  pokemons?: TeamPokemon[];
};

export type TeamPokemon = {
  id: number;
  pokemon_id: number;
  ability_id: number;
  nature_id: number;
  item_id: number | null;
  level: number;
  gender: "male" | "female" | "random" | "genderless";
  shiny: boolean;
  happiness: number;
  nickname: string | null;
  moves: number[];
  iv_hp: number; iv_atk: number; iv_def: number;
  iv_sp_atk: number; iv_sp_def: number; iv_speed: number;
  ev_hp: number; ev_atk: number; ev_def: number;
  ev_sp_atk: number; ev_sp_def: number; ev_speed: number;
};

export type Format = {
  id: number;
  name: string;
  tier: string;
};

export type Pokemon = {
  id: number;
  name: string;
  types: string[];
  tier: string;
  abilities: number[];
  evolvesFrom: number | null;
  genderType: string;
  baseStats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
};
