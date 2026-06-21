/* data.ts — display types for the Pokémon analysis page (client/app/pokedex/[slug]/page.tsx).
 * Sets and community activity (contributors/revisions/proposals) are real,
 * database-backed content now — see server/src/services/analysisService.ts
 * and client/lib/analysisMap.ts, which maps the API response into the shapes
 * below. Usage stats are a separate, unrelated real source (Smogon ladder
 * stats — see client/lib/usageStats.ts). Nothing here is hand-curated
 * anymore; types only. */

export type AnalysisSet = {
  id: number;
  name: string;
  role: string;
  tier: string;
  nature: string;
  item: string;
  ability: string;
  evs: string;
  moves: string[];
  analysis: string;
  evNote: string;
  teambuilding: string;
  matchupNote: string;
  handles: string[];
  threats: string[];
  provenance: { kind: "human" | "ai"; author: string; reviewers?: number; updated: string; status?: string };
};

export type UsageRow = { name: string; pct: number; type?: string; slug?: string };

export type Usage = {
  rate: number;
  blurb: string;
  abilities: UsageRow[];
  items: UsageRow[];
  moves: UsageRow[];
  teammates: UsageRow[];
  spreads: { spread: string; pct: number }[];
};

export type Contributor = { name: string; edits: number; role: string; ai?: boolean };
export type Revision = { author: string; ai: boolean; status: "merged" | "review"; when: string; summary: string; target: string };
export type Proposal = {
  id: number; author: string; target: string; when: string; votes: number; status: "pending"; isNew?: boolean;
  hasVoted: boolean;
  note: string;
  build?: { item: string; ability: string; nature: string; evs: string; moves: string[] };
  analysis?: string; evNote?: string; teambuilding?: string; matchupNote?: string;
};

export type Community = { contributors: Contributor[]; revisions: Revision[]; proposals: Proposal[] };

// Note: usage stats are a separate concern (client/lib/usageStats.ts, real
// Smogon ladder data) and aren't part of this shape — page.tsx merges them in
// independently of whether a community analysis exists.
export type MonAnalysis = {
  analysisId: number;
  role: string;
  overview: string;
  sets: AnalysisSet[];
  community: Community;
};
