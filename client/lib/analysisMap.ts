/* analysisMap.ts — maps a raw GET /pokemon-analyses/:id response (real,
 * database-backed community content — see server/src/services/analysisService.ts)
 * into the display shapes consumed by the Analysis/* components
 * (client/app/pokedex/[slug]/data.ts). Mirrors the role lib/teamBrowserMap.ts
 * plays for GET /teams. */
import * as LK from "@/lib/lookups";
import { relDate } from "@/lib/browserUtils";
import type { GBPokemon } from "@/lib/gameData";
import type { AnalysisSet, Contributor, Revision, Proposal, MonAnalysis } from "@/app/pokedex/[slug]/data";

export type RawBuildFields = {
  itemId: number | null;
  abilityId: number | null;
  natureId: number | null;
  evs: string | null;
  moves: string[] | null;
  analysis: string | null;
  evNote: string | null;
  teambuilding: string | null;
  matchupNote: string | null;
};

export type RawSet = RawBuildFields & {
  id: number;
  name: string;
  role: string | null;
  handles: number[];
  threats: number[];
  isAiDraft: boolean;
  updatedAt: string;
  lastEditedBy: string;
};

export type RawContributor = { name: string; edits: number; role: string; ai: boolean };
export type RawRevision = {
  id: number; setId: number | null; setName: string | null; authorId: number | null;
  isAi: boolean; status: "merged" | "pending"; summary: string; createdAt: string; author: string;
};
export type RawProposal = RawBuildFields & {
  id: number; authorId: number | null; targetName: string; note: string;
  status: "pending" | "accepted" | "rejected"; createdAt: string; votes: string | number;
  hasVoted: boolean; author: string;
};

export type RawAnalysis = {
  id: number;
  pokemonId: number;
  role: string | null;
  overview: string | null;
  sets: RawSet[];
  community: { contributors: RawContributor[]; revisions: RawRevision[]; proposals: RawProposal[] };
};

const handlesToSlugs = (ids: number[]): string[] =>
  ids.map((id) => LK.pokeById.get(id)).filter((p): p is GBPokemon => Boolean(p)).map((p) => LK.slug(p.name));

function mapSet(s: RawSet, mon: GBPokemon): AnalysisSet {
  return {
    id: s.id,
    name: s.name,
    role: s.role ?? "",
    tier: mon.tier,
    nature: (s.natureId && LK.natById.get(s.natureId)?.name) || "—",
    item: (s.itemId && LK.itemById.get(s.itemId)?.name) || "—",
    ability: (s.abilityId && LK.abilById.get(s.abilityId)?.name) || "—",
    evs: s.evs ?? "",
    moves: s.moves ?? [],
    analysis: s.analysis ?? "",
    evNote: s.evNote ?? "",
    teambuilding: s.teambuilding ?? "",
    matchupNote: s.matchupNote ?? "",
    handles: handlesToSlugs(s.handles),
    threats: handlesToSlugs(s.threats),
    provenance: {
      kind: s.isAiDraft ? "ai" : "human",
      author: s.isAiDraft ? "Claude" : s.lastEditedBy,
      updated: relDate(s.updatedAt),
      status: s.isAiDraft ? "needs-review" : undefined,
    },
  };
}

function mapRevision(r: RawRevision): Revision {
  return {
    author: r.author,
    ai: r.isAi,
    status: r.status === "pending" ? "review" : "merged",
    when: relDate(r.createdAt),
    summary: r.summary,
    target: r.setName ?? "Overview",
  };
}

function mapProposal(p: RawProposal): Proposal {
  const hasBuild = Boolean(p.moves && p.moves.length);
  return {
    id: p.id,
    author: p.author,
    target: p.targetName,
    when: relDate(p.createdAt),
    votes: Number(p.votes),
    status: "pending",
    isNew: hasBuild,
    hasVoted: p.hasVoted,
    note: p.note,
    build: hasBuild
      ? {
          item: (p.itemId && LK.itemById.get(p.itemId)?.name) || "",
          ability: (p.abilityId && LK.abilById.get(p.abilityId)?.name) || "",
          nature: (p.natureId && LK.natById.get(p.natureId)?.name) || "",
          evs: p.evs ?? "",
          moves: p.moves ?? [],
        }
      : undefined,
    analysis: p.analysis ?? undefined,
    evNote: p.evNote ?? undefined,
    teambuilding: p.teambuilding ?? undefined,
    matchupNote: p.matchupNote ?? undefined,
  };
}

export function mapAnalysis(raw: RawAnalysis, mon: GBPokemon): MonAnalysis {
  return {
    analysisId: raw.id,
    role: raw.role ?? "",
    overview: raw.overview ?? "",
    sets: raw.sets.map((s) => mapSet(s, mon)),
    community: {
      contributors: raw.community.contributors as Contributor[],
      revisions: raw.community.revisions.map(mapRevision),
      proposals: raw.community.proposals.map(mapProposal),
    },
  };
}
