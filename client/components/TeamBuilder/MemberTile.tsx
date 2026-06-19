"use client";

import * as LK from "@/lib/lookups";
import { tc, avatarColor } from "@/lib/browserUtils";
import { evSummary } from "@/lib/teamBuilder";
import type { DraftMember } from "@/lib/teamBuilder";
import { SpriteTile } from "@/components/ui/PokeToken";
import TypeBadge from "@/components/ui/TypeBadge";
import { cn } from "@/lib/cn";

const GLYPH = { M: "♂", F: "♀", N: "⚲" };

export default function MemberTile({
  member,
  active,
  noted,
  onClick,
}: {
  member: DraftMember;
  active: boolean;
  noted: boolean;
  onClick: () => void;
}) {
  const mon = LK.pokeById.get(member.pid);
  const item = member.itemId != null ? LK.itemById.get(member.itemId) : null;
  const nature = member.natureId != null ? LK.natById.get(member.natureId) : null;
  if (!mon) return null;
  const th = tc(mon.types[0]);

  return (
    <button
      className={cn(
        "tb2-tile-accent relative text-left w-full flex flex-col gap-2.5 bg-surface border rounded-[11px] px-3.25 py-3 transition-[border-color,box-shadow,transform] duration-140 hover:shadow-[0_7px_18px_-12px_var(--shadow-card)] hover:-translate-y-px",
        active ? "tb2-tile-accent--active border-accent shadow-[0_0_0_2px_var(--accent-soft)]" : "border-line",
      )}
      style={{ "--th": th } as React.CSSProperties}
      onClick={onClick}
    >
      <div className="flex items-center gap-2.75">
        <span className="shrink-0"><SpriteTile slug={LK.slug(mon.name)} name={mon.name} types={mon.types} size={50} /></span>
        <div className="flex-1 min-w-0 flex flex-col gap-0.75">
          <span className="text-[15px] font-extrabold tracking-[-0.01em] truncate flex items-center gap-1.25">
            {member.nickname || mon.name}
            {member.gender !== "N" && (
              <span className={cn("font-bold", member.gender === "M" ? "text-[#4b8de8]" : "text-[#e07da4]")}>{GLYPH[member.gender]}</span>
            )}
            {member.shiny && <span className="text-[#f2b32e]" title="Shiny">✦</span>}
          </span>
          <div className="flex gap-1">
            {mon.types.map((t) => <TypeBadge key={t} type={t} />)}
          </div>
        </div>
        {item && (
          <span className="flex items-center gap-1.5 text-[11.5px] text-muted ml-auto max-w-[46%]">
            <span
              className="w-4.5 h-4.5 rounded-[5px] grid place-items-center text-[8px] font-extrabold text-white shrink-0"
              style={{ background: avatarColor(item.name) }}
            >
              {item.name[0].toUpperCase()}
            </span>
            <b className="text-ink font-semibold truncate">{item.name}</b>
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-1.25">
        {member.moveIds.map((id, i) => {
          const move = id != null ? LK.moveById.get(id) : null;
          return (
            <span
              key={i}
              className={cn(
                "flex items-center gap-1.5 min-w-0 bg-surface-2 border border-line-soft rounded-md px-2 py-1 text-[11.5px]",
                move ? "font-semibold text-ink" : "font-medium italic text-faint",
              )}
            >
              <span className="w-1.75 h-1.75 rounded-full shrink-0" style={{ background: move ? tc(move.type) : "var(--line)" }} />
              <span className="truncate">{move?.name ?? "—"}</span>
            </span>
          );
        })}
      </div>
      <div className="flex items-center gap-1.75">
        <span className="text-[10.5px] font-bold text-muted bg-chip-bg rounded leading-normal px-1.5 py-0.5"><b className="text-ink">{nature ? nature.name : "—"}</b></span>
        <span className="text-[10.5px] font-bold text-muted bg-chip-bg rounded leading-normal px-1.5 py-0.5">{evSummary(member.evs)}</span>
        {noted && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-extrabold text-accent bg-accent-soft rounded-full px-2 py-0.5">
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16v12H7l-3 3z" /></svg>
            noted
          </span>
        )}
      </div>
    </button>
  );
}
