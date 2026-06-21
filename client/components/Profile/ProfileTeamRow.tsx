"use client";

import type { BrowserTeam } from "@/lib/lookups";
import { tierHue, fmtName, relDate } from "@/lib/browserUtils";
import TierBadge from "@/components/ui/TierBadge";
import MonSlot from "@/components/TeamsBrowser/MonSlot";
import { cn } from "@/lib/cn";

const HEART_PATH =
  "M12 21s-7.5-4.9-10-9.3C.4 8.4 2.2 5 5.6 5c2 0 3.3 1.2 4 2.3.7-1.1 2-2.3 4-2.3 3.4 0 5.2 3.4 3.6 6.7C19.5 16.1 12 21 12 21z";

export default function ProfileTeamRow({
  team,
  onLike,
}: {
  team: BrowserTeam;
  onLike: (id: number) => void;
}) {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-line-soft last:border-b-0 max-[700px]:flex-wrap">
      <TierBadge hue={tierHue(team.format)}>{fmtName(team.format)}</TierBadge>
      <span className="font-bold text-[15px] tracking-[-0.01em] flex-1 min-w-30 whitespace-nowrap overflow-hidden text-ellipsis">
        {team.name}
      </span>
      <div className="flex gap-2 shrink-0">
        {team.members.map((mon, i) => (
          <MonSlot key={i} mon={mon} size={33} />
        ))}
      </div>
      <button
        type="button"
        className={cn(
          "shrink-0 ml-3 inline-flex items-center gap-1.25 text-[13.5px] font-bold text-faint transition-colors duration-150 hover:text-like-fg",
          team.liked && "text-like-fg",
        )}
        onClick={() => onLike(team.id)}
        aria-label={team.liked ? "Unlike team" : "Like team"}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path d={HEART_PATH} fill={team.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
        <span className="font-mono tabular-nums">{team.likes}</span>
      </button>
      <span className="shrink-0 text-[12.5px] text-faint font-mono tabular-nums w-22 text-right">
        {relDate(team.createdAt)}
      </span>
    </div>
  );
}
