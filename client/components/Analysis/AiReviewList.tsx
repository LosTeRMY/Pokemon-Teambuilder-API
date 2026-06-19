import type { AnalysisSet } from "@/app/pokedex/[slug]/data";

// Read-only: no Approve/Refine actions, since there's nowhere for them to
// write to yet. This just surfaces which sets still need a human pass.
export default function AiReviewList({ sets }: { sets: AnalysisSet[] }) {
  const drafts = sets.filter((s) => s.provenance.kind === "ai");
  return (
    <section className="ai-card-tint flex flex-col bg-surface border border-line rounded-2xl p-5">
      <div className="flex items-center gap-2.25 mb-4">
        <span className="flex-none w-6.5 h-6.5 rounded-lg grid place-items-center bg-ai-soft text-ai">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
            <path d="M12 2l1.9 5.8H20l-4.9 3.6 1.9 5.8L12 13.6 7 17.2l1.9-5.8L4 7.8h6.1z" />
          </svg>
        </span>
        <h3 className="text-[14.5px] font-extrabold tracking-[-0.01em] m-0">
          AI baseline · awaiting review
        </h3>
        <span className="font-mono text-[10px] font-bold bg-accent text-white rounded-full px-1.75 py-px">
          {drafts.length}
        </span>
      </div>

      {drafts.length === 0 ? (
        <p className="text-[13px] text-faint leading-[1.5] m-0 mt-1">
          Every set has been reviewed by the community. Nothing in the queue.
        </p>
      ) : (
        <div className="flex flex-col gap-2.75">
          {drafts.map((s) => (
            <div
              key={s.id}
              className="ai-border border rounded-xl p-3.5 bg-surface"
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <b className="text-[14px] font-extrabold">{s.name}</b>
                <span className="ml-auto text-[12px] text-faint">{s.role}</span>
              </div>
              <p className="an-prose m-0 mb-3.25 text-[12.8px] leading-[1.55] text-muted">
                &ldquo;{s.analysis.split(". ").slice(0, 2).join(". ")}.&rdquo;
              </p>
              <div className="flex items-center gap-2 text-[11.5px] text-faint">
                <span className="flex-none w-5 h-5 rounded-full bg-ai text-white grid place-items-center text-[10px]">
                  ✦
                </span>
                Drafted by Claude · {s.provenance.updated}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mt-3.5 pt-3.25 border-t border-dashed border-line text-[12px] text-muted leading-[1.4]">
        <svg
          className="flex-none text-ai"
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        AI drafts are clearly flagged across the page until a human signs off.
      </div>
    </section>
  );
}
