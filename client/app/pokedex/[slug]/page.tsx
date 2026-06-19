"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useTheme } from "@/hooks/useTheme";
import * as LK from "@/lib/lookups";
import Hero from "@/components/Analysis/Hero";
import BaseStats from "@/components/Analysis/BaseStats";
import AbilityCard from "@/components/Analysis/AbilityCard";
import DefenseCard from "@/components/Analysis/DefenseCard";
import SetCard from "@/components/Analysis/SetCard";
import SetDrawer from "@/components/Analysis/SetDrawer";
import UsageDashboard from "@/components/Analysis/UsageDashboard";
import CommunitySection from "@/components/Analysis/CommunitySection";
import { ANALYSIS_BY_SLUG, type AnalysisSet, type Proposal } from "./data";

// Lets a "Suggest a new set" proposal reuse SetDrawer's view — only proposals
// with a full `build` attached (see ProposalsList) are openable this way.
function proposalToSet(p: Proposal): AnalysisSet {
  return {
    id: p.id,
    name: p.target,
    role: "Proposed set",
    tier: "ou",
    item: p.build?.item ?? "",
    ability: p.build?.ability ?? "",
    nature: p.build?.nature ?? "",
    evs: p.build?.evs ?? "",
    moves: p.build?.moves ?? [],
    analysis: p.analysis ?? "",
    evNote: p.evNote ?? "",
    teambuilding: p.teambuilding ?? "",
    matchupNote: p.matchupNote ?? "",
    handles: [],
    threats: [],
    provenance: { kind: "human", author: p.author, reviewers: 0, updated: p.when },
  };
}

export default function PokemonAnalysisPage() {
  const { theme, toggle } = useTheme();
  const { slug } = useParams<{ slug: string }>();

  // Real Pokémon but no curated analysis content yet, or not a real Pokémon
  // at all — either way there's nothing to render, so 404 honestly rather
  // than fake a page or silently fall back to a different mon.
  const mon = LK.pokeBySlug.get(slug);
  const data = ANALYSIS_BY_SLUG[slug];
  if (!mon || !data) notFound();

  const abilities = useMemo(() => LK.abilitiesForPokemon(mon.id), [mon.id]);

  // Move → type map for coloring move chips, derived from the curated usage
  // list since there's no other place that pairs a move name with its type here.
  const moveTypes = useMemo(() => {
    const m: Record<string, string> = {};
    data.usage.moves.forEach((mv) => { if (mv.type) m[mv.name] = mv.type; });
    return m;
  }, [data]);

  const [drawerSet, setDrawerSet] = useState<AnalysisSet | null>(null);
  const [drawerIndex, setDrawerIndex] = useState(0); // -1 means drawerSet is a proposal, not a ranked SETS entry

  const openSet = (id: string) => {
    const i = data.sets.findIndex((s) => s.id === id);
    if (i >= 0) { setDrawerSet(data.sets[i]); setDrawerIndex(i); }
  };
  const openProposed = (p: Proposal) => { setDrawerSet(proposalToSet(p)); setDrawerIndex(-1); };
  const closeDrawer = () => setDrawerSet(null);

  return (
    <>
      <Navbar theme={theme} onThemeToggle={toggle} />

      <main className="max-w-400 mx-auto px-10 pt-6 pb-32.5 max-[1080px]:px-6 max-[820px]:px-4 max-[820px]:pt-4.5">
        <Link className="inline-flex items-center gap-1.75 mb-5 text-[14px] font-bold text-muted hover:text-ink" href="/pokedex">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Back to Pokédex
        </Link>

        <Hero
          mon={mon}
          role={data.role}
          overview={data.overview}
          usageRate={data.usage.rate}
          topItemName={data.usage.items[0].name}
          topItemPct={data.usage.items[0].pct}
          setsCount={data.sets.length}
        />

        <div className="flex items-end justify-between gap-4 mt-10 mb-4">
          <h2 className="text-[23px] font-extrabold tracking-tight m-0">Stats &amp; matchups</h2>
        </div>
        <div className="grid grid-cols-[1.18fr_1fr] gap-4.5 items-stretch max-[1080px]:grid-cols-1">
          <BaseStats mon={mon} />
          <div className="flex flex-col gap-4.5">
            <AbilityCard abilities={abilities} />
            <DefenseCard types={mon.types} />
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 mt-10 mb-4 flex-wrap">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="text-[23px] font-extrabold tracking-tight m-0">Competitive movesets</h2>
            <p className="m-0 text-[13.5px] text-muted">{data.sets.length} viable builds, ranked by usage</p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-3.5 text-[11.5px] font-semibold text-muted">
              <span className="inline-flex items-center gap-1.5"><i className="w-2.25 h-2.25 rounded-[3px] bg-accent" />Community</span>
              <span className="inline-flex items-center gap-1.5"><i className="w-2.25 h-2.25 rounded-[3px] bg-ai" />AI baseline</span>
            </span>
            <span className="font-mono text-[11.5px] font-semibold text-faint bg-surface-2 border border-line rounded-full px-3 py-1.25">Gen 4 DPP · <b className="text-muted">Smogon</b></span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4.5 max-[1080px]:grid-cols-1">
          {data.sets.map((s, i) => (
            <SetCard key={s.id} set={s} index={i} moveTypes={moveTypes} onOpen={openSet} />
          ))}
        </div>

        <div className="flex items-end justify-between gap-4 mt-10 mb-4 flex-wrap">
          <div>
            <h2 className="text-[23px] font-extrabold tracking-tight m-0">In the current meta</h2>
            <p className="m-0 text-[13.5px] text-muted">What&apos;s actually being played on the ladder</p>
          </div>
          <span className="font-mono text-[11.5px] font-semibold text-faint bg-surface-2 border border-line rounded-full px-3 py-1.25">Smogon DPP OU · ladder stats</span>
        </div>
        <UsageDashboard usage={data.usage} />

        <div className="flex items-end justify-between gap-4 mt-10 mb-4">
          <h2 className="text-[23px] font-extrabold tracking-tight m-0">Community analysis</h2>
        </div>
        <CommunitySection
          contributors={data.community.contributors}
          revisions={data.community.revisions}
          proposals={data.community.proposals}
          sets={data.sets}
          onOpenProposed={openProposed}
        />
      </main>

      {drawerSet && (
        <SetDrawer key={drawerSet.id} set={drawerSet} index={drawerIndex} moveTypes={moveTypes} onClose={closeDrawer} />
      )}
    </>
  );
}
