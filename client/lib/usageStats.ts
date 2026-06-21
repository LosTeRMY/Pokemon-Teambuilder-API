/* USAGE_STATS — real Gen 4 ladder usage data fetched from Smogon's public chaos
 * stats (see scripts/fetch-usage-stats.mjs), keyed by Pokémon id. Only mons that
 * had ladder activity in their tier's latest available month are present —
 * everyone else has no entry, which callers should treat as "no usage data",
 * not zero usage. */
import usageStatsData from "../data/usage-stats.json";
import { GAMEDATA } from "./gameData";
import { slug } from "./lookups";
import type { Usage } from "@/app/pokedex/[slug]/data";

type UsageStatsFile = {
  generated: string;
  sources: Record<string, { month: string; cutoff: number; battles: number }>;
  byId: Record<string, Usage>;
};

const USAGE_STATS = usageStatsData as UsageStatsFile;

export const usageSources = USAGE_STATS.sources;

export const usageBySlug = new Map<string, Usage>(
  GAMEDATA.pokemons
    .filter((p) => USAGE_STATS.byId[p.id])
    .map((p) => [slug(p.name), USAGE_STATS.byId[p.id]]),
);
