"use client";

import type { Combo, FilterState, BrowserTeam } from "@/lib/lookups";
import TeamCard from "./TeamCard";
import SummaryPills from "./SummaryPills";
import { cn } from "@/lib/cn";

export default function TeamDisplay({
  filtered,
  s,
  set,
  removeFromList,
  removeCombo,
  activeCount,
  onLike,
  onClear,
  copied,
  copyLink,
  size,
  compact,
  setDrawer,
}: {
  filtered: BrowserTeam[];
  s: FilterState;
  set: (patch: Partial<FilterState>) => void;
  removeFromList: (key: "pokemon" | "move" | "ability" | "item", id: number) => void;
  removeCombo: (c: Combo) => void;
  activeCount: number;
  onLike: (id: number) => void;
  onClear: () => void;
  copied: boolean;
  copyLink: () => void;
  size: number;
  compact: boolean;
  setDrawer: (open: boolean) => void;
}) {
  return (
    <main className="flex-1 min-w-0 px-11 pt-7.5 pb-22.5 max-[900px]:px-4 max-[900px]:pt-4.5 max-[900px]:pb-20">
      <div className="flex items-end justify-between gap-4 mb-4.5">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-[27px] font-extrabold tracking-[-0.02em] m-0">
            Community teams
          </h1>
          <span className="text-[14px] text-faint font-mono tabular-nums">
            {filtered.length} {filtered.length === 1 ? "team" : "teams"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="hidden max-[900px]:inline-flex items-center gap-1.75 whitespace-nowrap bg-surface border border-line rounded-[9px] px-3.25 py-2 text-[14px] font-bold text-ink"
            onClick={() => setDrawer(true)}
          >
            Filters
            {activeCount > 0 && (
              <span className="bg-accent text-white text-[10.5px] font-bold rounded-[20px] px-1.5 py-px">
                {activeCount}
              </span>
            )}
          </button>
          <button
            className={cn(
              "bg-surface border border-line rounded-[9px] whitespace-nowrap px-3.75 py-2.25 text-[14px] font-bold text-muted transition-all duration-140 hover:border-muted hover:text-ink",
              copied && "link-btn--ok",
            )}
            onClick={copyLink}
          >
            {copied ? "Link copied" : "Copy link"}
          </button>
          <div className="sort flex items-center gap-1.75">
            <label className="font-mono tabular-nums">SORT</label>
            <select
              value={s.sort}
              onChange={(e) =>
                set({ sort: e.target.value as FilterState["sort"] })
              }
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="popular">Most liked</option>
            </select>
          </div>
        </div>
      </div>

      {activeCount > 0 && (
        <SummaryPills
          s={s}
          set={set}
          removeFromList={removeFromList}
          removeCombo={removeCombo}
        />
      )}

      {filtered.length === 0 ? (
        <div className="text-center px-5 py-17.5 text-muted flex flex-col items-center gap-4">
          <p className="m-0 text-[15px]">No teams match every active filter.</p>
          <p className="m-0 text-[13px] text-faint">
            All filters combine with AND — try removing one.
          </p>
          <button
            className="bg-accent text-white border-none whitespace-nowrap text-[15px] font-bold px-4.75 py-2.75 rounded-[10px] transition-[filter] duration-150 hover:brightness-[1.07]"
            onClick={onClear}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-col gap-3.5",
            compact && "gap-1.75",
          )}
        >
          {filtered.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              size={size}
              compact={compact}
              onLike={onLike}
            />
          ))}
        </div>
      )}
    </main>
  );
}
