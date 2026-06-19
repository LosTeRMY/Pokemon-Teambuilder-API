"use client";

import type { DraftTeam } from "@/lib/teamBuilder";
import { fmtColor } from "@/lib/teamBuilder";
import { fmtName } from "@/lib/browserUtils";
import * as LK from "@/lib/lookups";
import { SpriteTile } from "@/components/ui/PokeToken";
import { cn } from "@/lib/cn";

export default function TeamListCard({
  team,
  active,
  dirty,
  notesCount,
  onOpen,
  onDelete,
}: {
  team: DraftTeam;
  active: boolean;
  dirty: boolean;
  notesCount: number;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const filled = team.members.filter(Boolean) as NonNullable<DraftTeam["members"][number]>[];

  return (
    <div
      className={cn(
        "group relative text-left w-full flex flex-col gap-2.25 bg-surface border rounded-[10px] pl-3.25 pr-3 py-2.75 transition-[border-color,box-shadow,transform] duration-140 hover:shadow-[0_6px_16px_-10px_var(--shadow-card)] hover:-translate-y-px",
        active ? "border-accent shadow-[0_0_0_2px_var(--accent-soft)]" : "border-line",
      )}
      style={{ "--th": fmtColor(team.formatId), borderLeft: `3px solid var(--th, var(--accent))` } as React.CSSProperties}
    >
      {/* Fills the whole card as the primary click target; sits below the delete/lock
          button in paint order (flex items paint in DOM order) so that button stays
          independently clickable instead of being nested inside this one. */}
      <button type="button" className="absolute inset-0 rounded-[10px]" onClick={onOpen} aria-label={`Open ${team.name}`} />
      {!team.published ? (
        <button
          type="button"
          aria-label="Delete draft"
          title="Delete draft"
          className="absolute top-2 right-2 w-6 h-6 grid place-items-center rounded-md bg-surface-2 border border-line text-faint opacity-0 group-hover:opacity-100 transition-opacity duration-120 hover:text-like-fg hover:bg-like-bg hover:border-like-bd"
          onClick={onDelete}
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /></svg>
        </button>
      ) : (
        <span
          title="Published — protected from deletion"
          className="absolute top-2.25 right-2.25 w-5.5 h-5.5 grid place-items-center rounded-md text-[#8a52e0] bg-[color-mix(in_srgb,#7a3fd0_13%,var(--surface))]"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
        </span>
      )}
      <div className="flex items-start gap-2">
        <span className="flex-1 min-w-0 text-[13.5px] font-extrabold tracking-[-0.01em] leading-[1.25] line-clamp-2">{team.name}</span>
        {team.formatId != null && <span className="tb2-tcard-fmt">{fmtName(team.formatId)}</span>}
      </div>
      <div className="flex gap-px">
        {filled.length > 0 ? (
          filled.slice(0, 6).map((m) => {
            const mon = LK.pokeById.get(m.pid);
            return mon ? <SpriteTile key={m.uid} slug={LK.slug(mon.name)} name={mon.name} types={mon.types} size={30} /> : null;
          })
        ) : (
          <span className="text-[11.5px] text-faint italic py-1">No Pokémon yet</span>
        )}
      </div>
      <div className="flex items-center gap-2 text-[11px] text-faint">
        <span>{filled.length}/6 Pokémon</span>
        {dirty && (
          <>
            <span className="w-0.75 h-0.75 rounded-full bg-faint shrink-0" />
            <span className="text-[9px] font-extrabold uppercase tracking-[0.03em] rounded px-1.5 py-0.5 bg-[color-mix(in_srgb,#d98a2b_16%,var(--surface))] text-[#c47a1e]">unsaved</span>
          </>
        )}
        {!dirty && team.published && (
          <>
            <span className="w-0.75 h-0.75 rounded-full bg-faint shrink-0" />
            <span className="text-[9px] font-extrabold uppercase tracking-[0.03em] rounded px-1.5 py-0.5 bg-[color-mix(in_srgb,#7a3fd0_15%,var(--surface))] text-[#8a52e0]">published</span>
          </>
        )}
        {!dirty && !team.published && (
          <>
            <span className="w-0.75 h-0.75 rounded-full bg-faint shrink-0" />
            <span className="text-[9px] font-extrabold uppercase tracking-[0.03em] rounded px-1.5 py-0.5 bg-[color-mix(in_srgb,#2f9a5a_15%,var(--surface))] text-[#2f9a5a]">draft</span>
          </>
        )}
        {notesCount > 0 && (
          <span className="inline-flex items-center gap-0.75 ml-auto text-[11px] font-bold text-muted">
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="text-accent"><path d="M4 4h16v12H7l-3 3z" /></svg>
            {notesCount}
          </span>
        )}
      </div>
    </div>
  );
}
