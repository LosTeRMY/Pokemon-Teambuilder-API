"use client";

import type { DraftTeam } from "@/lib/teamBuilder";

export default function DeleteTeamModal({
  team,
  onCancel,
  onConfirm,
}: {
  team: DraftTeam;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <div className="flex items-center gap-3 px-5.5 py-4.5 border-b border-line">
        <div className="flex-1">
          <h3 className="text-[18px] font-extrabold tracking-[-0.01em] m-0">Delete published team</h3>
          <span className="text-[12.5px] text-muted font-medium">This can&rsquo;t be undone.</span>
        </div>
        <button
          className="w-8.5 h-8.5 grid place-items-center rounded-lg bg-surface border border-line text-muted hover:text-ink hover:border-muted"
          onClick={onCancel}
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="px-5.5 py-5">
        <p className="m-0 text-[13.5px] leading-[1.55] text-ink">
          Delete <strong>{team.name}</strong>? It will be removed from the public team library along with its
          likes, and there&rsquo;s no way to recover it afterward.
        </p>
      </div>
      <div className="flex items-center justify-end gap-2.25 px-5.5 py-3.5 border-t border-line">
        <button
          className="inline-flex items-center whitespace-nowrap bg-surface border border-line rounded-[9px] px-3.5 py-2.25 text-[13.5px] font-bold text-ink hover:border-muted hover:bg-surface-2"
          onClick={onCancel}
        >
          Cancel
        </button>
        <button
          className="inline-flex items-center whitespace-nowrap bg-like-fg text-white border border-like-fg rounded-[9px] px-3.5 py-2.25 text-[13.5px] font-bold hover:brightness-[1.07]"
          onClick={onConfirm}
        >
          Delete team
        </button>
      </div>
    </>
  );
}
