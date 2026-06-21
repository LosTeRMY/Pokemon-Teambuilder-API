import { z } from "zod";

const analysisPageSchema = z.object({
  role: z.string().max(120).optional(),
  overview: z.string().max(2000).optional(),
});

// Shared by sets and proposals — a recommended build's structured fields.
// evs is a free-text display string ("4 HP / 252 Atk / 252 Spe"), not
// validated per-stat like createTeamSchema's evs — this is reference
// content, not an enforced playable team (see server/CLAUDE.md).
const buildFieldsSchema = z.object({
  itemId: z.number().int().optional(),
  abilityId: z.number().int().optional(),
  natureId: z.number().int().optional(),
  evs: z.string().max(60).optional(),
  moves: z.array(z.string().min(1).max(60)).min(1).max(4).optional(),
  analysis: z.string().max(4000).optional(),
  evNote: z.string().max(2000).optional(),
  teambuilding: z.string().max(2000).optional(),
  matchupNote: z.string().max(2000).optional(),
});

const setSchema = buildFieldsSchema.extend({
  name: z.string().min(1).max(80),
  role: z.string().max(120).optional(),
  moves: z.array(z.string().min(1).max(60)).min(1).max(4),
  handles: z.array(z.number().int()).max(10).optional(),
  threats: z.array(z.number().int()).max(10).optional(),
});

const proposalSchema = buildFieldsSchema.extend({
  targetName: z.string().min(1).max(80),
  note: z.string().min(1).max(1000),
});

export { analysisPageSchema, setSchema, proposalSchema };
