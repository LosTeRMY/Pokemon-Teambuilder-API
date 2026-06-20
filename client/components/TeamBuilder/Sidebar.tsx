"use client";

import type { DraftTeam } from "@/lib/teamBuilder";
import type { SidebarFilter } from "@/hooks/useTeamBuilder";
import * as LK from "@/lib/lookups";
import TeamListCard from "./TeamListCard";
import { cn } from "@/lib/cn";

const TABS: { key: SidebarFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "published", label: "Published" },
];

export default function Sidebar({
  savedTeams,
  activeId,
  dirty,
  query,
  onQuery,
  filter,
  onFilter,
  onNew,
  onOpen,
  onDelete,
  onRequestDelete,
  drawer,
  onCloseDrawer,
}: {
  savedTeams: DraftTeam[];
  activeId: string;
  dirty: boolean;
  query: string;
  onQuery: (q: string) => void;
  filter: SidebarFilter;
  onFilter: (f: SidebarFilter) => void;
  onNew: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onRequestDelete: (id: string) => void;
  drawer: boolean;
  onCloseDrawer: () => void;
}) {
  const q = query.trim().toLowerCase();
  const match = (t: DraftTeam) => {
    const ok = !q || t.name.toLowerCase().includes(q) || t.members.some((m) => {
      if (!m) return false;
      const mon = LK.pokeById.get(m.pid);
      return (mon && mon.name.toLowerCase().includes(q)) || m.nickname.toLowerCase().includes(q);
    });
    if (!ok) return false;
    if (filter === "draft") return !t.published;
    if (filter === "published") return !!t.published;
    return true;
  };
  const list = savedTeams.filter(match);
  const counts = {
    all: savedTeams.length,
    draft: savedTeams.filter((t) => !t.published).length,
    published: savedTeams.filter((t) => t.published).length,
  };
  const hasAny = savedTeams.length > 0;

  return (
    <aside
      className={cn(
        "flex-none w-78 flex flex-col border-r border-line bg-surface-2 min-h-0",
        "max-[980px]:fixed max-[980px]:top-18 max-[980px]:left-0 max-[980px]:bottom-0 max-[980px]:z-60",
        "max-[980px]:shadow-[0_0_40px_-10px_var(--shadow-pop)] max-[980px]:transition-transform max-[980px]:duration-220 max-[980px]:ease-in-out",
        drawer ? "max-[980px]:translate-x-0" : "max-[980px]:-translate-x-full",
      )}
    >
      <div className="flex flex-col gap-3 px-4 pt-4 pb-3 border-b border-line">
        <div className="flex items-center gap-2.25">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
          <h2 className="text-[16px] font-extrabold tracking-[-0.01em] m-0 flex-1">My teams</h2>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 bg-accent text-white border-0 rounded-lg px-2.75 py-1.75 text-[12.5px] font-bold transition-[filter] duration-140 hover:brightness-[1.08]"
            onClick={onNew}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            New
          </button>
          <button
            type="button"
            aria-label="Close"
            className="hidden max-[980px]:grid w-7.5 h-7.5 place-items-center rounded-[7px] bg-surface border border-line text-muted"
            onClick={onCloseDrawer}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="relative">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            value={query}
            placeholder="Search by team or Pokémon…"
            onChange={(e) => onQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-2 border border-line rounded-lg text-[13px] text-ink bg-input-bg focus:outline-none focus:border-accent focus:bg-surface focus:shadow-[0_0_0_3px_var(--accent-soft)]"
          />
        </div>
        {hasAny && (
          <div className="flex gap-0.75 bg-chip-bg rounded-[9px] p-0.75" role="group" aria-label="Filter teams">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-1.25 rounded-[7px] py-1.5 text-[11.5px] font-bold transition-colors duration-120",
                  filter === t.key ? "bg-surface text-ink shadow-[0_1px_3px_var(--shadow-card)]" : "text-muted hover:text-ink",
                )}
                onClick={() => onFilter(t.key)}
              >
                {t.label}
                <span className={cn(
                  "font-mono text-[9.5px] font-bold rounded-full px-1.25 py-px",
                  filter === t.key ? "text-accent bg-accent-soft" : "text-faint bg-chip-bg",
                )}>
                  {counts[t.key]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-3 pb-7">
        {!hasAny ? (
          <div className="flex flex-col items-center text-center gap-3 px-6 py-11.5 m-2 border-[1.5px] border-dashed border-line rounded-[14px] bg-surface text-muted">
            <div className="w-16 h-16 rounded-full grid place-items-center text-accent bg-accent-soft">
              <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M12 11v5M9.5 13.5h5" /></svg>
            </div>
            <h3 className="text-[15px] font-extrabold tracking-[-0.01em] mt-0.5 mb-0 text-ink">Your folder is empty</h3>
            <p className="m-0 text-[12.5px] leading-[1.55] max-w-55">Teams you save show up here, split into drafts and published. Build one to get started.</p>
            <button
              type="button"
              className="mt-1 inline-flex items-center gap-1.75 bg-accent text-white border-0 rounded-[9px] px-3.5 py-2.25 text-[13.5px] font-bold hover:brightness-[1.07]"
              onClick={onNew}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
              Create a team
            </button>
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center text-center gap-3 px-5 py-7.5 m-2 border border-line-soft rounded-[14px] bg-surface text-muted">
            <div className="w-11.5 h-11.5 rounded-full grid place-items-center text-faint bg-chip-bg">
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            </div>
            <p className="m-0 text-[12.5px] leading-[1.55] max-w-55">
              {query ? <>No teams match &ldquo;{query}&rdquo;.</> : filter === "published" ? "Nothing published yet — publish a team from the editor." : "No drafts right now."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {list.map((t) => (
              <TeamListCard
                key={t.id}
                team={t}
                active={t.id === activeId}
                dirty={t.id === activeId && dirty}
                notesCount={t.members.filter((m) => m && (m.notes.text.trim() || m.notes.roles.length)).length}
                onOpen={() => onOpen(t.id)}
                onDelete={() => onDelete(t.id)}
                onRequestDelete={() => onRequestDelete(t.id)}
              />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
