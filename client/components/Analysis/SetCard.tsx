import * as LK from "@/lib/lookups";
import { tc, avatarColor } from "@/lib/browserUtils";
import { PokeToken } from "@/components/ui/PokeToken";
import TierBadge, { TIER_HUE, TIER_LABEL } from "@/components/ui/TierBadge";
import type { AnalysisSet } from "@/app/pokedex/[slug]/data";
import { cn } from "@/lib/cn";

// Small enough to duplicate verbatim in SetDrawer.tsx rather than share —
// resolves a curated handles/threats slug to a real Pokémon id for the sprite,
// falling back to PokeToken's own "unknown id" placeholder when not found.
function MonRow({
  label,
  kind,
  slugs,
}: {
  label: string;
  kind: "ok" | "bad";
  slugs: string[];
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "flex-none w-23 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.02em]",
          kind === "ok" ? "text-ok" : "text-like-fg",
        )}
      >
        {label}
      </span>
      <div className="flex gap-1.5 flex-wrap">
        {slugs.map((s) => {
          const pid = LK.pokeBySlug.get(s)?.id ?? -1;
          return <PokeToken key={s} pid={pid} size={28} />;
        })}
      </div>
    </div>
  );
}

export default function SetCard({
  set,
  index,
  moveTypes,
  onOpen,
}: {
  set: AnalysisSet;
  index: number;
  moveTypes: Record<string, string>;
  onOpen: (id: string) => void;
}) {
  const isAI = set.provenance.kind === "ai";
  return (
    <div
      className={cn(
        "flex flex-col bg-surface border border-line rounded-2xl overflow-hidden transition-shadow duration-150 hover:shadow-[0_10px_30px_-18px_var(--shadow-card)]",
        isAI && "ai-border",
      )}
    >
      <button
        className="w-full text-left bg-surface-2 border-0 border-b border-line-soft cursor-pointer flex items-center gap-3.25 px-5 py-4 transition-colors duration-140 hover:bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface-2))]"
        onClick={() => onOpen(set.id)}
      >
        <span className="flex-none w-7.5 h-7.5 rounded-[9px] bg-ink text-surface grid place-items-center text-[14px] font-extrabold font-mono">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0 flex flex-col gap-px">
          <span className="text-[17px] font-extrabold tracking-[-0.015em]">
            {set.name}
          </span>
          <span className="text-[12px] text-faint">{set.role}</span>
        </div>
        {TIER_HUE[set.tier] && (
          <TierBadge hue={TIER_HUE[set.tier]}>{TIER_LABEL[set.tier]}</TierBadge>
        )}
        {isAI && (
          <span className="ai-flag inline-flex items-center gap-1.5 text-[11px] font-bold rounded-full px-2.5 py-1 whitespace-nowrap">
            ✦ AI baseline
          </span>
        )}
      </button>

      <div className="flex flex-col gap-4 px-5 py-4.5 flex-1">
        {isAI && (
          <div
            className="bg-ai-soft border rounded-[10px] px-3.25 py-2.5 text-[12.5px] leading-[1.5] text-muted"
            style={{
              borderColor: "color-mix(in srgb, var(--ai) 22%, var(--surface))",
            }}
          >
            <b className="text-ai">✦ AI-drafted baseline.</b> Generated as a
            starting point and awaiting community review.
          </div>
        )}

        <div className="grid grid-cols-4 border border-line-soft rounded-[11px] overflow-hidden">
          {[
            ["Item", set.item],
            ["Ability", set.ability],
            ["Nature", set.nature],
            ["EVs", set.evs],
          ].map(([k, v], i) => (
            <div
              key={k}
              className={cn(
                "flex flex-col gap-0.75 px-3 py-2.5 bg-surface-2",
                i < 3 && "border-r border-line-soft",
              )}
            >
              <span className="text-[9.5px] font-bold tracking-[0.06em] uppercase text-faint">
                {k}
              </span>
              <span
                className={cn(
                  "text-[13px] font-bold whitespace-nowrap overflow-hidden text-ellipsis",
                  k === "EVs" && "font-mono text-[11.5px]",
                )}
              >
                {v}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.75">
          {set.moves.map((mv) => {
            const base = mv.split(" / ")[0];
            const col = tc(moveTypes[base] || "");
            return (
              <span
                key={mv}
                className="inline-flex items-center gap-1.75 text-[13px] font-semibold bg-surface-2 border border-line rounded-[8px] py-1.5 pr-2.75 pl-2.25"
              >
                <span
                  className="w-2 h-2 rounded-full flex-none"
                  style={{ background: col }}
                />
                {mv}
              </span>
            );
          })}
        </div>

        <p className="an-prose m-0 text-[13.8px] leading-[1.6] text-muted line-clamp-4">
          {set.analysis}
        </p>

        <div className="flex flex-col gap-2.25">
          <MonRow label="Handles" kind="ok" slugs={set.handles} />
          <MonRow label="Watch out" kind="bad" slugs={set.threats} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap mt-auto px-5 py-3.25 border-t border-line-soft bg-surface-2">
        <div className="flex items-center gap-2.25 min-w-0">
          <span
            className={cn(
              "flex-none w-6.5 h-6.5 rounded-full text-white grid place-items-center font-bold text-[12px]",
              isAI && "bg-ai",
            )}
            style={
              !isAI
                ? { background: avatarColor(set.provenance.author) }
                : undefined
            }
          >
            {isAI ? "✦" : set.provenance.author[0].toUpperCase()}
          </span>
          <span className="text-[12.5px] text-ink">
            {isAI ? "Drafted by " : "Maintained by "}
            <b className="font-bold">{set.provenance.author}</b>
            <span className="text-faint">
              {" "}
              · {isAI
                ? "needs review"
                : `${set.provenance.reviewers} reviews`}{" "}
              · {set.provenance.updated}
            </span>
          </span>
        </div>
        <button
          className={cn(
            "inline-flex items-center gap-1.75 flex-none border bg-surface text-muted text-[12.5px] font-bold px-3.25 py-1.75 rounded-[9px] transition-all duration-140 hover:border-accent hover:text-accent hover:bg-accent-soft",
            isAI && "ai-border text-ai hover:bg-ai-soft",
          )}
          onClick={() => onOpen(set.id)}
        >
          {isAI ? "Review draft" : "View analysis"}
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
