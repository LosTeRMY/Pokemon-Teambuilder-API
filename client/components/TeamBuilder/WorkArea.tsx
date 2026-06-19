"use client";

import { useState } from "react";
import type { DraftTeam, DraftMember, DraftNotes } from "@/lib/teamBuilder";
import type { GBFormat } from "@/lib/gameData";
import MemberTile from "./MemberTile";
import AddTile from "./AddTile";
import Editor from "./Editor";
import { cn } from "@/lib/cn";

function noteHasContent(n: DraftNotes | undefined): boolean {
  return !!n && (n.roles.length > 0 || n.text.trim().length > 0);
}

export default function WorkArea({
  team,
  dirty,
  memberCount,
  formats,
  selected,
  setSelected,
  onSetName,
  onSetFormat,
  onSetStrategy,
  onSave,
  onPublish,
  onExport,
  onAddSlot,
  onUpdateMember,
  onUpdateNotes,
  onSwapMember,
  onOpenDrawer,
}: {
  team: DraftTeam;
  dirty: boolean;
  memberCount: number;
  formats: GBFormat[];
  selected: number | null;
  setSelected: (i: number | null) => void;
  onSetName: (name: string) => void;
  onSetFormat: (id: number | null) => void;
  onSetStrategy: (text: string) => void;
  onSave: () => void;
  onPublish: () => void;
  onExport: () => void;
  onAddSlot: (i: number) => void;
  onUpdateMember: (i: number, patch: Partial<DraftMember>) => void;
  onUpdateNotes: (i: number, notes: DraftNotes) => void;
  onSwapMember: (i: number) => void;
  onOpenDrawer: () => void;
}) {
  const [stratOpen, setStratOpen] = useState(false);
  const selectedMember = selected != null ? team.members[selected] : null;
  const strategy = team.strategy || "";
  const stratPreview = strategy.trim()
    ? strategy.trim().replace(/\s+/g, " ").slice(0, 80)
    : "Add a one-paragraph game plan — win condition, leads, threats to watch.";

  return (
    <main className="flex-1 min-w-0 min-h-0 flex flex-col">
      <div className="flex-none flex items-center gap-4.5 flex-wrap px-6.5 py-3.5 border-b border-line bg-surface">
        <button
          type="button"
          className="hidden max-[980px]:inline-flex items-center gap-1.75 whitespace-nowrap bg-surface border border-line rounded-[9px] px-3.5 py-2.25 text-[13.5px] font-bold text-ink"
          onClick={onOpenDrawer}
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          Teams
        </button>
        <div className="flex-1 min-w-60 flex flex-col gap-1.75">
          <input
            value={team.name}
            onChange={(e) => onSetName(e.target.value)}
            aria-label="Team name"
            spellCheck={false}
            className="text-[22px] font-extrabold tracking-[-0.02em] text-ink bg-transparent border-0 border-b-2 border-b-transparent px-0.5 py-0.5 w-full max-w-115 hover:border-b-line focus:outline-none focus:border-b-accent"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={team.formatId ?? ""}
              onChange={(e) => onSetFormat(e.target.value ? Number(e.target.value) : null)}
              aria-label="Format"
              className="font-bold text-[12.5px] text-accent bg-accent-soft border-0 rounded-[7px] px-2.25 py-1.25 focus:outline focus:outline-2 focus:outline-accent"
            >
              {formats.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <span className="text-[12.5px] text-faint"><b className="text-ink">{memberCount}</b>/6 Pokémon</span>
            <span className="text-[12px] text-faint inline-flex items-center gap-1.25">
              <i className={cn("w-1.75 h-1.75 rounded-full", dirty ? "bg-[#d98a2b]" : "bg-[#3aa05a]")} />
              {dirty ? "Unsaved changes" : "All changes saved"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="inline-flex items-center gap-1.75 whitespace-nowrap bg-surface border border-line rounded-[9px] px-3.5 py-2.25 text-[13.5px] font-bold text-ink hover:border-muted hover:bg-surface-2"
            onClick={onSave}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>
            Save
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.75 whitespace-nowrap bg-surface border border-line rounded-[9px] px-3.5 py-2.25 text-[13.5px] font-bold text-ink hover:border-muted hover:bg-surface-2"
            onClick={onPublish}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
            Publish
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.75 whitespace-nowrap bg-accent text-white border border-accent rounded-[9px] px-3.5 py-2.25 text-[13.5px] font-bold hover:brightness-[1.07]"
            onClick={onExport}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M16 6l-4-4-4 4M12 2v13" /></svg>
            Export
          </button>
        </div>
      </div>

      {memberCount > 0 && (
        <div className="m-0 border-b border-line bg-surface">
          <button
            type="button"
            className="flex items-center gap-2.5 px-6.5 py-2.75 w-full bg-transparent border-0 text-left text-ink hover:bg-surface-2"
            onClick={() => setStratOpen((o) => !o)}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={cn("text-faint transition-transform duration-150", stratOpen && "rotate-90")}><path d="m9 18 6-6-6-6" /></svg>
            <h4 className="text-[13px] font-extrabold m-0 flex items-center gap-2">Team strategy</h4>
            {!stratOpen && <span className="flex-1 min-w-0 text-[12.5px] text-faint font-medium truncate">{stratPreview}</span>}
            {strategy.trim() && <span className="text-[10px] font-extrabold text-accent bg-accent-soft rounded-full px-2 py-0.5">written</span>}
          </button>
          {stratOpen && (
            <div className="px-6.5 pb-4">
              <textarea
                value={strategy}
                placeholder="Game plan: how the team wins, ideal lead, threats to watch, and how the pieces fit together…"
                onChange={(e) => onSetStrategy(e.target.value)}
                className="w-full min-h-21 resize-y text-[13.5px] leading-[1.55] text-ink bg-input-bg border border-line rounded-[10px] px-3.25 py-2.75 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)] focus:bg-surface"
              />
            </div>
          )}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-[minmax(340px,400px)_1fr] items-stretch min-h-full max-[1240px]:grid-cols-1">
          <div className="flex flex-col gap-2.5 px-4.5 pt-4.5 pb-15 border-r border-line max-[1240px]:border-r-0 max-[1240px]:border-b max-[1240px]:grid max-[1240px]:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] max-[1240px]:items-start max-[620px]:grid-cols-1 max-[620px]:px-3.5 max-[620px]:pb-12.5">
            <div className="flex items-center justify-between px-0.5 pb-0.5 max-[1240px]:col-span-full">
              <span className="text-[10.5px] font-extrabold tracking-wider uppercase text-faint">Team · {memberCount}/6</span>
            </div>
            {team.members.map((m, i) =>
              m ? (
                <MemberTile
                  key={m.uid}
                  member={m}
                  active={selected === i}
                  noted={noteHasContent(m.notes)}
                  onClick={() => setSelected(i)}
                />
              ) : (
                <AddTile key={i} onClick={() => onAddSlot(i)} />
              ),
            )}
          </div>

          <div className="min-w-0 bg-surface-2 px-6 pt-4.5 pb-8 max-[620px]:px-3.5 max-[620px]:pt-3.5 max-[620px]:pb-12.5">
            {selectedMember ? (
              <Editor
                member={selectedMember}
                notes={selectedMember.notes}
                onChange={(patch) => onUpdateMember(selected!, patch)}
                onNote={(notes) => onUpdateNotes(selected!, notes)}
                onClose={() => setSelected(null)}
                onSwap={() => onSwapMember(selected!)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 text-center px-7.5 py-16 text-muted max-w-115 mx-auto mt-10">
                <svg width="76" height="76" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="44" fill="var(--surface)" stroke="var(--line)" strokeWidth="5" />
                  <path d="M6 50h88" stroke="var(--line)" strokeWidth="5" />
                  <circle cx="50" cy="50" r="14" fill="var(--surface)" stroke="var(--line)" strokeWidth="5" />
                </svg>
                <h3 className="text-[19px] font-extrabold tracking-[-0.01em] m-0 text-ink">{memberCount === 0 ? "Empty team" : "Pick a Pokémon to edit"}</h3>
                <p className="m-0 text-[13.5px] leading-[1.55]">
                  {memberCount === 0
                    ? "Add up to six Pokémon, then tune items, abilities, moves, natures and EVs here."
                    : "Select any team member on the left to edit its set, or add a new one to an open slot."}
                </p>
                {memberCount < 6 && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.75 whitespace-nowrap bg-accent text-white border border-accent rounded-[9px] px-3.5 py-2.25 text-[13.5px] font-bold hover:brightness-[1.07]"
                    onClick={() => onAddSlot(team.members.findIndex((m) => !m))}
                  >
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                    Add a Pokémon
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
