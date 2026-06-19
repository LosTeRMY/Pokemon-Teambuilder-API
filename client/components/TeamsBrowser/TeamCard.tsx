"use client";

import type { BrowserTeam } from "@/lib/lookups";
import { tierHue, fmtName, relDate, avatarColor } from "@/lib/browserUtils";
import TierBadge from "@/components/ui/TierBadge";
import MonSlot from "./MonSlot";
import { cn } from "@/lib/cn";

export default function TeamCard({
  team,
  size,
  compact,
  onLike,
}: {
  team: BrowserTeam;
  size: number;
  compact: boolean;
  onLike: (id: number) => void;
}) {
  const like = (
    <button
      className={cn(
        "shrink-0 inline-flex items-center gap-1.5 bg-surface border border-line rounded-lg px-3 py-1.5 text-[14px] font-bold text-muted transition-all duration-150 hover:border-like-bd hover:text-like-fg active:scale-[0.94]",
        team.liked && "text-like-fg border-like-bd bg-like-bg",
      )}
      onClick={() => onLike(team.id)}
      aria-label="Like team"
    >
      <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
        <path
          d="M12 21s-7.5-4.9-10-9.3C.4 8.4 2.2 5 5.6 5c2 0 3.3 1.2 4 2.3.7-1.1 2-2.3 4-2.3 3.4 0 5.2 3.4 3.6 6.7C19.5 16.1 12 21 12 21z"
          fill={team.liked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-mono tabular-nums">{team.likes}</span>
    </button>
  );
  const byline = (
    <div className="shrink-0 flex items-center gap-2.75 max-[900px]:ml-auto">
      <span
        className="w-9 h-9 rounded-full text-white grid place-items-center font-bold text-[15px] shrink-0"
        style={{ background: avatarColor(team.author.name) }}
      >
        {team.author.name[0].toUpperCase()}
      </span>
      <div className="flex flex-col leading-[1.3]">
        <span className="text-[14px] font-semibold">{team.author.name}</span>
        <span className="text-[12px] text-faint font-mono tabular-nums">
          {relDate(team.createdAt)}
        </span>
      </div>
    </div>
  );
  return (
    <article
      className={cn(
        "flex flex-col gap-4 bg-surface border border-line rounded-(--radius) p-[22px_28px] transition-[border-color,box-shadow] duration-150 hover:border-muted hover:shadow-[0_6px_20px_-10px_var(--shadow-card)]",
        compact && "card--compact p-[12px_16px] gap-2.25",
      )}
    >
      <div className="flex items-center gap-3">
        <TierBadge hue={tierHue(team.format)}>{fmtName(team.format)}</TierBadge>
        <h3 className="card-title text-[20px] font-bold tracking-[-0.01em] m-0 flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
          {team.name}
        </h3>
        {like}
      </div>
      {!compact && team.description && (
        <p className="card-desc">{team.description}</p>
      )}
      <div className="flex items-center justify-between gap-8 max-[900px]:flex-wrap max-[900px]:gap-3">
        <div className="mon-row flex gap-3 flex-wrap min-w-0">
          {team.members.map((mon, i) => (
            <MonSlot key={i} mon={mon} size={size} />
          ))}
        </div>
        {byline}
      </div>
    </article>
  );
}
