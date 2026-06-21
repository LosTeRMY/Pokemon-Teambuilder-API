"use client";

import { useState } from "react";
import { avatarColor } from "@/lib/browserUtils";
import type { Proposal } from "@/app/pokedex/[slug]/data";
import { cn } from "@/lib/cn";

export default function ProposalsList({
  proposals,
  onOpenProposed,
  onVote,
  isModerator,
  onAccept,
  onReject,
}: {
  proposals: Proposal[];
  onOpenProposed: (p: Proposal) => void;
  onVote?: (id: number, voted: boolean) => void;
  isModerator?: boolean;
  onAccept?: (id: number) => void;
  onReject?: (id: number) => void;
}) {
  // Top/New is a presentational re-sort only — votes themselves are static
  // display data here, there's no vote action wired up.
  const [sort, setSort] = useState<"top" | "new">("top");
  const sorted =
    sort === "top"
      ? [...proposals].sort((a, b) => b.votes - a.votes)
      : proposals;

  return (
    <section className="flex flex-col bg-surface border border-line rounded-2xl p-5">
      <div className="flex items-center gap-2.25 mb-4">
        <span className="flex-none w-6.5 h-6.5 rounded-lg grid place-items-center bg-accent-soft text-accent">
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 8h10M7 12h6M5 3h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-4 4z" />
          </svg>
        </span>
        <h3 className="text-[14.5px] font-extrabold tracking-[-0.01em] m-0">
          Open proposals
        </h3>
        <span className="font-mono text-[10px] font-bold bg-accent text-white rounded-full px-1.75 py-px">
          {proposals.length}
        </span>
        {proposals.length > 1 && (
          <span
            className="ml-auto inline-flex gap-0.5 bg-surface-2 border border-line rounded-lg p-0.5"
            role="tablist"
          >
            {(["top", "new"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={sort === s}
                className={cn(
                  "text-[11px] font-bold px-2.5 py-1 rounded-md text-muted capitalize transition-colors duration-140",
                  sort === s
                    ? "bg-surface text-accent shadow-[0_1px_2px_var(--shadow-card)]"
                    : "hover:text-ink",
                )}
                onClick={() => setSort(s)}
              >
                {s}
              </button>
            ))}
          </span>
        )}
      </div>

      {proposals.length === 0 ? (
        <p className="text-[13px] text-faint leading-[1.5] m-0 mt-1">
          No open proposals.
        </p>
      ) : (
        <div className="flex flex-col gap-2.75">
          {sorted.map((p) => (
            <div
              key={p.id}
              className="bg-surface-2 border border-line-soft rounded-xl px-3.5 py-3.25"
            >
              <div className="flex items-center gap-2 flex-wrap mb-2.25">
                <span
                  className="flex-none w-5.5 h-5.5 rounded-full text-white grid place-items-center font-bold text-[11px]"
                  style={{ background: avatarColor(p.author) }}
                >
                  {p.author[0].toUpperCase()}
                </span>
                <b className="text-[12.5px] font-bold">{p.author}</b>
                {p.isNew && (
                  <span
                    className="text-[10px] font-extrabold uppercase tracking-[0.03em] text-accent bg-accent-soft border rounded-md px-1.75 py-0.5"
                    style={{
                      borderColor:
                        "color-mix(in srgb, var(--accent) 26%, var(--surface))",
                    }}
                  >
                    ＋ New set
                  </span>
                )}
                <span className="text-[11.5px] font-bold text-accent">
                  {p.isNew ? p.target : `→ ${p.target}`}
                </span>
                <span className="ml-auto text-[11px] text-faint">{p.when}</span>
              </div>
              <p className="an-prose m-0 mb-2.75 text-[12.8px] leading-[1.5] text-muted">
                {p.note}
              </p>
              {p.isNew && p.build && (
                <button
                  className="inline-flex items-center gap-2 self-start mb-2.75 border border-line bg-surface text-accent text-[12px] font-bold px-3 py-1.5 rounded-lg transition-colors duration-140 hover:bg-accent-soft"
                  onClick={() => onOpenProposed(p)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="m20 20-3.5-3.5" />
                  </svg>
                  View proposed set
                </button>
              )}
              <div className="flex items-center justify-between gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.75">
                  <span
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-bold rounded-full px-2.75 py-1"
                    style={{
                      color: "var(--warn)",
                      background: "var(--warn-soft)",
                      border:
                        "1px solid color-mix(in srgb, var(--warn) 26%, var(--surface))",
                    }}
                  >
                    <i className="w-1.5 h-1.5 rounded-full bg-warn" />
                    Pending review
                  </span>
                  {isModerator && (
                    <>
                      <button
                        className="text-[11.5px] font-bold text-ok px-2 py-1 rounded-lg border border-line bg-surface hover:bg-ok-soft"
                        onClick={() => onAccept?.(p.id)}
                      >
                        Accept
                      </button>
                      <button
                        className="text-[11.5px] font-bold text-like-fg px-2 py-1 rounded-lg border border-line bg-surface hover:bg-surface-2"
                        onClick={() => onReject?.(p.id)}
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
                <button
                  className={cn(
                    "inline-flex items-center gap-1.5 border text-[12px] font-bold px-2.75 py-1.25 rounded-lg transition-colors duration-140",
                    p.hasVoted
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-line bg-surface text-muted hover:border-accent hover:text-accent",
                  )}
                  title={p.hasVoted ? "Remove your vote" : "Vote for this proposal"}
                  onClick={() => onVote?.(p.id, p.hasVoted)}
                  disabled={!onVote}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m6 15 6-6 6 6" />
                  </svg>
                  <span className="font-mono">{p.votes}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
