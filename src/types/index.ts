export {};

declare global {
    namespace Express {
        export interface Request {
            userId?: number;
        }
    }
}

type Pokemon = {
  id: number;
  name: string;
  types: string[];
  genderType: string;
  baseStats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  abilities: number[];
  tier: string;
  evolvesFrom: number | null;
};

export type { Pokemon };
