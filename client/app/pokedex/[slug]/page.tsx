"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { usePokemonAnalysis } from "@/hooks/usePokemonAnalysis";
import * as LK from "@/lib/lookups";
import Hero from "@/components/Analysis/Hero";
import BaseStats from "@/components/Analysis/BaseStats";
import AbilityCard from "@/components/Analysis/AbilityCard";
import DefenseCard from "@/components/Analysis/DefenseCard";
import SetCard from "@/components/Analysis/SetCard";
import SetDrawer from "@/components/Analysis/SetDrawer";
import SetForm from "@/components/Analysis/SetForm";
import UsageDashboard from "@/components/Analysis/UsageDashboard";
import CommunitySection from "@/components/Analysis/CommunitySection";
import Modal from "@/components/TeamBuilder/Modal";
import Toast from "@/components/ui/Toast";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";
import { usageBySlug } from "@/lib/usageStats";
import { TIER_LABEL } from "@/lib/browserUtils";
import type { AnalysisSet, Proposal } from "./data";

// Lets a "Suggest a new set" proposal reuse SetDrawer's view — only proposals
// with a full `build` attached (see ProposalsList) are openable this way.
function proposalToSet(p: Proposal, tier: string): AnalysisSet {
  return {
    id: p.id,
    name: p.target,
    role: "Proposed set",
    tier,
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
    provenance: { kind: "human", author: p.author, updated: p.when },
  };
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center text-center text-[13.5px] text-faint bg-surface border border-dashed border-line rounded-2xl px-6 py-10">
      {message}
    </div>
  );
}

export default function PokemonAnalysisPage() {
  const { theme, toggle } = useTheme();
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const loggedIn = !!user;
  const isModerator = user?.role === "moderator" || user?.role === "admin";

  // Every real Pokémon gets a page — stats, abilities, and type defenses come
  // from real game data and always render. Community analysis (sets, votes,
  // proposals) is real, database-backed content (see usePokemonAnalysis) —
  // most mons just don't have any yet, so those sections show an empty state
  // below instead of 404ing the page.
  const mon = LK.pokeBySlug.get(slug);
  if (!mon) notFound();

  const { analysis: data, updateOverview, addSet, editSet, proposeSet, vote, acceptProposal, rejectProposal } = usePokemonAnalysis(mon);
  const usage = usageBySlug.get(slug);

  const abilities = useMemo(() => LK.abilitiesForPokemon(mon.id), [mon.id]);

  // Move → type map for coloring move chips, derived from the usage move
  // list since there's no other place that pairs a move name with its type here.
  const moveTypes = useMemo(() => {
    const m: Record<string, string> = {};
    usage?.moves.forEach((mv) => { if (mv.type) m[mv.name] = mv.type; });
    return m;
  }, [usage]);

  const [drawerSet, setDrawerSet] = useState<AnalysisSet | null>(null);
  const [drawerIndex, setDrawerIndex] = useState(0); // -1 means drawerSet is a proposal, not a ranked SETS entry
  const [toast, setToast] = useState<string | null>(null);
  const [editingOverview, setEditingOverview] = useState(false);
  const [overviewDraft, setOverviewDraft] = useState({ role: "", overview: "" });
  const [showAddSet, setShowAddSet] = useState(false);
  const [showPropose, setShowPropose] = useState(false);
  const [editingSet, setEditingSet] = useState<AnalysisSet | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const openSet = (id: number) => {
    if (!data) return;
    const i = data.sets.findIndex((s) => s.id === id);
    if (i >= 0) { setDrawerSet(data.sets[i]); setDrawerIndex(i); }
  };
  const openProposed = (p: Proposal) => { setDrawerSet(proposalToSet(p, mon.tier)); setDrawerIndex(-1); };
  const closeDrawer = () => setDrawerSet(null);

  const startEditOverview = () => {
    setOverviewDraft({ role: data?.role ?? "", overview: data?.overview ?? "" });
    setEditingOverview(true);
  };
  const submitOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateOverview({ role: overviewDraft.role.trim() || undefined, overview: overviewDraft.overview.trim() || undefined });
    setEditingOverview(false);
    setToast("Overview updated.");
  };

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
          role={data?.role}
          overview={data?.overview}
          usageRate={usage?.rate}
          topItemName={usage?.items[0]?.name}
          topItemPct={usage?.items[0]?.pct}
          setsCount={data?.sets.length}
        />

        {loggedIn && (
          <div className="flex justify-end mt-2.5">
            <button className="text-[12.5px] font-bold text-muted hover:text-accent" onClick={startEditOverview}>
              Edit role &amp; overview
            </button>
          </div>
        )}

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
            {data && data.sets.length > 0 && <p className="m-0 text-[13.5px] text-muted">{data.sets.length} viable builds, ranked by usage</p>}
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {data && data.sets.length > 0 && (
              <span className="inline-flex items-center gap-3.5 text-[11.5px] font-semibold text-muted">
                <span className="inline-flex items-center gap-1.5"><i className="w-2.25 h-2.25 rounded-[3px] bg-accent" />Community</span>
                <span className="inline-flex items-center gap-1.5"><i className="w-2.25 h-2.25 rounded-[3px] bg-ai" />AI baseline</span>
              </span>
            )}
            <span className="font-mono text-[11.5px] font-semibold text-faint bg-surface-2 border border-line rounded-full px-3 py-1.25">Gen 4 DPP · <b className="text-muted">Smogon</b></span>
            {loggedIn && (
              <>
                <button className="border border-line bg-surface text-muted text-[12.5px] font-bold px-3 py-1.5 rounded-[9px] hover:border-accent hover:text-accent" onClick={() => setShowAddSet(true)}>
                  + Add a set
                </button>
                <button className="border border-line bg-surface text-muted text-[12.5px] font-bold px-3 py-1.5 rounded-[9px] hover:border-accent hover:text-accent" onClick={() => setShowPropose(true)}>
                  Suggest a set
                </button>
              </>
            )}
          </div>
        </div>
        {data && data.sets.length > 0 ? (
          <div className="grid grid-cols-2 gap-4.5 max-[1080px]:grid-cols-1">
            {data.sets.map((s, i) => (
              <SetCard key={s.id} set={s} index={i} moveTypes={moveTypes} onOpen={openSet} />
            ))}
          </div>
        ) : (
          <EmptySection message="No competitive movesets documented yet for this Pokémon." />
        )}

        <div className="flex items-end justify-between gap-4 mt-10 mb-4 flex-wrap">
          <div>
            <h2 className="text-[23px] font-extrabold tracking-tight m-0">In the current meta</h2>
            <p className="m-0 text-[13.5px] text-muted">What&apos;s actually being played on the ladder</p>
          </div>
          {usage && <span className="font-mono text-[11.5px] font-semibold text-faint bg-surface-2 border border-line rounded-full px-3 py-1.25">Smogon DPP {TIER_LABEL[mon.tier] ?? mon.tier.toUpperCase()} · ladder stats</span>}
        </div>
        {usage ? (
          <UsageDashboard usage={usage} />
        ) : (
          <EmptySection message="No usage data collected yet for this Pokémon." />
        )}

        <div className="flex items-end justify-between gap-4 mt-10 mb-4">
          <h2 className="text-[23px] font-extrabold tracking-tight m-0">Community analysis</h2>
        </div>
        {data && (data.community.contributors.length > 0 || data.community.proposals.length > 0) ? (
          <CommunitySection
            contributors={data.community.contributors}
            revisions={data.community.revisions}
            proposals={data.community.proposals}
            sets={data.sets}
            onOpenProposed={openProposed}
            onVote={loggedIn ? (id, voted) => vote({ proposalId: id, voted }) : undefined}
            isModerator={isModerator}
            onAccept={async (id) => { await acceptProposal(id); setToast("Proposal accepted."); }}
            onReject={async (id) => { await rejectProposal(id); setToast("Proposal rejected."); }}
          />
        ) : (
          <EmptySection message="No community activity yet for this Pokémon." />
        )}
      </main>

      {drawerSet && (
        <SetDrawer
          key={drawerSet.id}
          set={drawerSet}
          index={drawerIndex}
          moveTypes={moveTypes}
          onClose={closeDrawer}
          onEdit={loggedIn ? (s) => { setEditingSet(s); closeDrawer(); } : undefined}
        />
      )}

      {toast && <Toast message={toast} />}

      {editingOverview && (
        <Modal onClose={() => setEditingOverview(false)}>
          <form onSubmit={submitOverview} className="flex flex-col gap-3.5 px-6 py-5.5">
            <h3 className="text-[18px] font-extrabold m-0">Edit role &amp; overview</h3>
            <div className="flex flex-col gap-1.25">
              <Label>Role</Label>
              <Input value={overviewDraft.role} onChange={(e) => setOverviewDraft((d) => ({ ...d, role: e.target.value }))} placeholder="e.g. Sand-setting wallbreaker" />
            </div>
            <div className="flex flex-col gap-1.25">
              <Label>Overview</Label>
              <textarea
                className="w-full px-3.25 py-2.75 border border-line rounded-[9px] text-[14px] font-[inherit] text-ink bg-input-bg resize-y min-h-32"
                value={overviewDraft.overview}
                onChange={(e) => setOverviewDraft((d) => ({ ...d, overview: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-1">
              <button type="button" className="border border-line bg-surface text-muted text-[13.5px] font-bold px-4 py-2.25 rounded-[9px]" onClick={() => setEditingOverview(false)}>
                Cancel
              </button>
              <button type="submit" className="border-0 bg-accent text-white text-[13.5px] font-bold px-4 py-2.25 rounded-[9px]">
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showAddSet && (
        <Modal onClose={() => setShowAddSet(false)} wide>
          <SetForm
            mode="set"
            onSubmit={async (formData) => {
              await addSet(formData as Parameters<typeof addSet>[0]);
              setShowAddSet(false);
              setToast("Set added.");
            }}
            onCancel={() => setShowAddSet(false)}
          />
        </Modal>
      )}

      {editingSet && (
        <Modal onClose={() => setEditingSet(null)} wide>
          <SetForm
            mode="set"
            initial={{
              name: editingSet.name,
              role: editingSet.role,
              itemId: String(LK.opts.items.find((i) => i.name === editingSet.item)?.id ?? ""),
              abilityId: String(LK.opts.abilities.find((a) => a.name === editingSet.ability)?.id ?? ""),
              natureId: String(LK.opts.natures.find((n) => n.name === editingSet.nature)?.id ?? ""),
              evs: editingSet.evs,
              moves: [editingSet.moves[0] ?? "", editingSet.moves[1] ?? "", editingSet.moves[2] ?? "", editingSet.moves[3] ?? ""],
              analysis: editingSet.analysis,
              evNote: editingSet.evNote,
              teambuilding: editingSet.teambuilding,
              matchupNote: editingSet.matchupNote,
            }}
            onSubmit={async (formData) => {
              await editSet({ setId: editingSet.id, data: formData as Parameters<typeof addSet>[0] });
              setEditingSet(null);
              setToast("Set updated.");
            }}
            onCancel={() => setEditingSet(null)}
          />
        </Modal>
      )}

      {showPropose && (
        <Modal onClose={() => setShowPropose(false)} wide>
          <SetForm
            mode="proposal"
            onSubmit={async (formData) => {
              await proposeSet(formData as Parameters<typeof proposeSet>[0]);
              setShowPropose(false);
              setToast("Proposal submitted.");
            }}
            onCancel={() => setShowPropose(false)}
          />
        </Modal>
      )}
    </>
  );
}
