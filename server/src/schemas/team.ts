import { z } from "zod";

const pokemonSchema = z.object({
  pokemonId: z.number().int(),
  abilityId: z.number().int(),
  natureId: z.number().int(),
  itemId: z.number().int().optional(),
  nickname: z.string().max(12).optional(),
  gender: z.enum(["male", "female", "random", "genderless"]),
  shiny: z.boolean().default(false),
  happiness: z.number().int().min(0).max(255).default(255),
  moves: z.array(z.number().int()).min(1).max(4),
  ivs: z.object({
    hp: z.number().int().min(0).max(31).default(31),
    atk: z.number().int().min(0).max(31).default(31),
    def: z.number().int().min(0).max(31).default(31),
    sp_atk: z.number().int().min(0).max(31).default(31),
    sp_def: z.number().int().min(0).max(31).default(31),
    speed: z.number().int().min(0).max(31).default(31),
  }),
  evs: z.object({
    hp: z.number().int().min(0).max(252).default(0),
    atk: z.number().int().min(0).max(252).default(0),
    def: z.number().int().min(0).max(252).default(0),
    sp_atk: z.number().int().min(0).max(252).default(0),
    sp_def: z.number().int().min(0).max(252).default(0),
    speed: z.number().int().min(0).max(252).default(0),
  }).refine(evs => Object.values(evs).reduce((sum, val) => sum + val, 0) <= 508, {
    message: "Total EVs cannot exceed 508",
  }),
  notes: z.object({
    roles: z.array(z.string()).default([]),
    text: z.string().max(500).default(""),
  }).optional(),
});

const createTeamSchema = z.object({
  name: z.string().min(1).max(30),
  formatId: z.number().int(),
  description: z.string().max(500).optional(),
  pokemons: z.array(pokemonSchema).length(6),
});

export { createTeamSchema, pokemonSchema };
