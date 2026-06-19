"use client";

import { useEffect } from "react";
import * as LK from "@/lib/lookups";
import { tc, avatarColor } from "@/lib/browserUtils";
import { PokeToken } from "@/components/ui/PokeToken";
import TierBadge, { TIER_HUE, TIER_LABEL } from "@/components/ui/TierBadge";
import type { AnalysisSet } from "@/app/pokedex/[slug]/data";
import { cn } from "@/lib/cn";

// Duplicated from SetCard.tsx (see comment there) rather than shared.
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
          return <PokeToken key={s} pid={pid} size={30} />;
        })}
      </div>
    </div>
  );
}

// Labeled block with a trailing rule, used for each prose section below.
function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2.25">
      <span className="flex items-center gap-2.75 text-[10.5px] font-bold tracking-[0.09em] uppercase text-faint after:content-[''] after:flex-1 after:h-px after:bg-line-soft">
        {label}
      </span>
      {children}
    </section>
  );
}

// View-only by design: no edit/propose/vote actions here, since none of that
// persists anywhere yet. `index` is the set's rank in SETS, or -1 when this
// is showing a community proposal that isn't a real (ranked) set.
export default function SetDrawer({
  set,
  index,
  moveTypes,
  onClose,
}: {
  set: AnalysisSet;
  index: number;
  moveTypes: Record<string, string>;
  onClose: () => void;
}) {
  const isAI = set.provenance.kind === "ai";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[65] bg-[rgba(15,22,34,0.5)] flex justify-end"
      onMouseDown={onClose}
    >
      <aside
        className={cn(
          "w-full max-w-140 h-full flex flex-col bg-surface border-l border-line shadow-[-24px_0_60px_-18px_var(--shadow-pop)]",
          isAI && "ai-border",
        )}
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`${set.name} full analysis`}
      >
        <div
          className={cn(
            "flex items-center gap-3.25 px-5.5 py-5 border-b border-line-soft bg-surface-2",
            isAI && "bg-ai-soft",
          )}
        >
          {/* index is -1 for a community proposal (not a ranked real set) — show a marker instead of "0" */}
          <span className="flex-none w-8.5 h-8.5 rounded-[9px] bg-ink text-surface grid place-items-center text-[15px] font-extrabold font-mono">
            {index >= 0 ? index + 1 : "＋"}
          </span>
          <div className="flex-1 min-w-0 flex flex-col gap-0.75">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-[20px] font-extrabold tracking-[-0.02em] m-0">
                {set.name}
              </h3>
              {TIER_HUE[set.tier] && (
                <TierBadge hue={TIER_HUE[set.tier]}>
                  {TIER_LABEL[set.tier]}
                </TierBadge>
              )}
              {isAI && (
                <span className="ai-flag inline-flex items-center gap-1.5 text-[11px] font-bold rounded-full px-2.5 py-1">
                  ✦ AI baseline
                </span>
              )}
            </div>
            <span className="text-[12px] text-faint">{set.role}</span>
          </div>
          <button
            className="bg-transparent border-0 text-[16px] text-faint p-1.5 rounded-md hover:text-ink hover:bg-surface-2 cursor-pointer"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5.5 py-5 flex flex-col gap-4.5">
          {isAI && (
            <div
              className="bg-ai-soft border rounded-[10px] px-3.25 py-2.5 text-[12.5px] leading-[1.5] text-muted"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--ai) 22%, var(--surface))",
              }}
            >
              <b className="text-ai">✦ AI-drafted baseline.</b> This analysis
              was generated as a starting point and is awaiting community
              review.
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

          <Section label="Overview">
            <p className="an-prose m-0 text-[13.8px] leading-[1.6] text-muted">
              {set.analysis}
            </p>
          </Section>

          {set.evNote && (
            <Section label="EV spread breakdown">
              <p className="an-prose m-0 text-[13.8px] leading-[1.6] text-muted">
                {set.evNote}
              </p>
            </Section>
          )}

          {set.teambuilding && (
            <Section label="Teambuilding">
              <p className="an-prose m-0 text-[13.8px] leading-[1.6] text-muted">
                {set.teambuilding}
              </p>
            </Section>
          )}

          <Section label="Matchups">
            {set.matchupNote && (
              <p className="an-prose m-0 mb-3.5 text-[13.8px] leading-[1.6] text-muted">
                {set.matchupNote}
              </p>
            )}
            <div className="flex flex-col gap-2.25">
              {set.handles.length > 0 && (
                <MonRow label="Handles" kind="ok" slugs={set.handles} />
              )}
              {set.threats.length > 0 && (
                <MonRow label="Watch out" kind="bad" slugs={set.threats} />
              )}
            </div>
          </Section>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap px-5.5 py-3.75 border-t border-line-soft bg-surface-2">
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
                ·{" "}
                {isAI
                  ? "needs review"
                  : `${set.provenance.reviewers} reviews`}{" "}
                · {set.provenance.updated}
              </span>
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
