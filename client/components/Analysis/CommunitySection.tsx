import { avatarColor } from "@/lib/browserUtils";
import type { AnalysisSet, Contributor, Proposal, Revision } from "@/app/pokedex/[slug]/data";
import AiReviewList from "./AiReviewList";
import ProposalsList from "./ProposalsList";
import ActivityTimeline from "./ActivityTimeline";

function CommunityBanner({ contributors, revisions, sets }: { contributors: Contributor[]; revisions: Revision[]; sets: AnalysisSet[] }) {
  const merged = revisions.filter((r) => r.status === "merged").length;
  const aiSets = sets.filter((s) => s.provenance.kind === "ai").length;
  // "Human-reviewed" = share of sets that aren't still sitting as an
  // unreviewed AI draft — not a count of edits that went through review.
  const reviewedPct = Math.round(((sets.length - aiSets) / sets.length) * 100);
  return (
    <div className="flex items-center gap-5.5 flex-wrap bg-surface border border-line rounded-2xl px-6 py-4.5">
      <div className="flex items-center gap-3.25 flex-1 min-w-60">
        <span className="flex-none w-10.5 h-10.5 rounded-xl grid place-items-center text-white" style={{ background: "linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent), var(--ai) 55%))" }}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
        </span>
        <div>
          <h3 className="text-[16px] font-extrabold tracking-[-0.015em] m-0 mb-0.75">A living, community-maintained analysis</h3>
          <p className="an-prose m-0 text-[13px] leading-[1.45] text-muted max-w-[64ch]">
            Claude drafts a baseline for every set; players review and refine it before it&apos;s considered settled.
          </p>
        </div>
      </div>
      <div className="flex items-stretch gap-0">
        {[
          ["Contributors", contributors.length],
          ["Merged edits", merged],
          ["Human-reviewed", `${reviewedPct}%`],
        ].map(([label, val], i) => (
          <div key={label} className={`flex flex-col gap-0.5 px-5 ${i > 0 ? "border-l border-line-soft" : ""}`}>
            <b className="font-mono text-[21px] font-extrabold tracking-[-0.02em]">{val}</b>
            <span className="text-[11px] font-bold tracking-[0.04em] uppercase text-faint">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContributorsStrip({ contributors }: { contributors: Contributor[] }) {
  return (
    <div className="flex items-center gap-3.5 flex-wrap bg-surface border border-line rounded-2xl px-5 py-3.5">
      <span className="text-[11px] font-bold tracking-widest uppercase text-faint mr-1">Contributors</span>
      {contributors.map((c) => (
        <span key={c.name} className="inline-flex items-center gap-2.25 pl-1.5 pr-3.25 py-1.5 bg-surface-2 border border-line-soft rounded-full">
          <span className={`flex-none w-7 h-7 rounded-full text-white grid place-items-center font-bold text-[12px] ${c.ai ? "bg-ai" : ""}`} style={!c.ai ? { background: avatarColor(c.name) } : undefined}>
            {c.ai ? "✦" : c.name[0].toUpperCase()}
          </span>
          <span className="flex flex-col leading-[1.2]">
            <span className="text-[13px] font-bold">{c.name}</span>
            <span className="text-[10.5px] text-faint">{c.role}</span>
          </span>
          <span className="font-mono text-[11px] font-bold text-muted bg-surface border border-line rounded-md px-1.75 py-0.5">{c.edits}</span>
        </span>
      ))}
    </div>
  );
}

export default function CommunitySection({
  contributors,
  revisions,
  proposals,
  sets,
  onOpenProposed,
}: {
  contributors: Contributor[];
  revisions: Revision[];
  proposals: Proposal[];
  sets: AnalysisSet[];
  onOpenProposed: (p: Proposal) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <CommunityBanner contributors={contributors} revisions={revisions} sets={sets} />
      <ContributorsStrip contributors={contributors} />
      <div className="grid grid-cols-[1.15fr_1fr_1fr] gap-4 items-start max-[1240px]:grid-cols-2 max-[820px]:grid-cols-1">
        <div className="max-[1240px]:col-span-2 max-[820px]:col-span-1">
          <AiReviewList sets={sets} />
        </div>
        <ProposalsList proposals={proposals} onOpenProposed={onOpenProposed} />
        <ActivityTimeline revisions={revisions} />
      </div>
    </div>
  );
}
