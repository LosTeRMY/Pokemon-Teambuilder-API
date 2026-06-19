"use client";

import * as LK from "@/lib/lookups";
import { tc } from "@/lib/browserUtils";
import { genderOptions, type DraftMember, type DraftNotes, type StatKey } from "@/lib/teamBuilder";
import { SpriteTile } from "@/components/ui/PokeToken";
import TypeBadge from "@/components/ui/TypeBadge";
import ItemPicker from "./ItemPicker";
import AbilityPicker from "./AbilityPicker";
import NaturePicker from "./NaturePicker";
import MovesEditor from "./MovesEditor";
import EvIvEditor from "./EvIvEditor";
import NotesTab from "./NotesTab";
import { cn } from "@/lib/cn";

const GLYPH = { M: "♂", F: "♀", N: "⚲" };

export default function Editor({
  member,
  notes,
  onChange,
  onNote,
  onClose,
  onSwap,
}: {
  member: DraftMember;
  notes: DraftNotes;
  onChange: (patch: Partial<DraftMember>) => void;
  onNote: (notes: DraftNotes) => void;
  onClose: () => void;
  onSwap: () => void;
}) {
  const mon = LK.pokeById.get(member.pid);
  if (!mon) return null;

  const genders = genderOptions(mon.genderType);
  const t1 = tc(mon.types[0]);
  const edTint = `color-mix(in srgb, ${t1} 13%, var(--surface))`;
  const noted = notes.text.trim().length > 0 || notes.roles.length > 0;

  return (
    <div className="motion-safe:animate-[tb2In_0.18s_ease] bg-surface border border-line rounded-[14px] shadow-[0_12px_36px_-24px_var(--shadow-card)] overflow-hidden flex flex-col">
      <div
        className="flex items-center gap-4 px-5 py-4.25 border-b border-line bg-[linear-gradient(115deg,var(--ed-tint,var(--surface-2))_0%,var(--surface)_64%)]"
        style={{ "--ed-tint": edTint } as React.CSSProperties}
      >
        <button
          onClick={onSwap}
          title="Change species"
          className="tb2-ed-spr shrink-0 relative cursor-pointer p-0 border-0 bg-transparent"
        >
          <SpriteTile slug={LK.slug(mon.name)} name={mon.name} types={mon.types} size={70} />
        </button>
        <div className="flex-1 min-w-0 flex flex-col gap-1.25">
          <div className="flex items-center gap-2.75 flex-wrap">
            <input
              placeholder={mon.name}
              value={member.nickname}
              onChange={(e) => onChange({ nickname: e.target.value })}
              aria-label="Nickname"
              spellCheck={false}
              className="text-[21px] font-extrabold tracking-[-0.02em] text-ink bg-transparent border-0 border-b-2 border-b-transparent px-0.5 py-0.5 min-w-25 max-w-70 hover:border-b-line focus:outline-none focus:border-b-accent"
            />
            <div className="flex gap-1.25">{mon.types.map((t) => <TypeBadge key={t} type={t} />)}</div>
          </div>
          <span className="text-[12px] text-muted font-semibold flex items-center gap-2">
            <b className="text-ink">{mon.name}</b> · #{String(mon.dexNum ?? 0).padStart(3, "0")}
            <button type="button" className="bg-transparent border-0 text-accent font-bold text-[12px] cursor-pointer p-0" onClick={onSwap}>↺ change species</button>
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {genders.length > 1 ? (
            <div className="inline-flex bg-surface-2 border border-line rounded-lg p-0.75 gap-0.5" role="group" aria-label="Gender">
              {genders.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={cn("rounded-md px-2.75 py-1.25 text-[12.5px] font-bold", g === member.gender ? "text-white" : "text-muted hover:text-ink")}
                  style={g === member.gender ? { background: g === "M" ? "#4b8de8" : "#e07da4" } : undefined}
                  onClick={() => onChange({ gender: g })}
                >
                  {GLYPH[g]} {g === "M" ? "Male" : "Female"}
                </button>
              ))}
            </div>
          ) : (
            <span className="text-[12px] font-bold text-muted bg-chip-bg rounded-[5px] px-2.75 py-1.75">
              {genders[0] === "N" ? "⚲ Genderless" : `${GLYPH[genders[0]]} ${genders[0] === "M" ? "Male only" : "Female only"}`}
            </span>
          )}
          <button
            type="button"
            className={cn(
              "tb-toggle inline-flex items-center gap-2 border rounded-lg px-2.75 py-1.5 text-[12.5px] font-bold",
              member.shiny
                ? "on text-[#9a7011] border-[#f2cd76] bg-[color-mix(in_srgb,#f2b32e_16%,var(--surface))]"
                : "text-muted bg-surface-2 border-line",
            )}
            onClick={() => onChange({ shiny: !member.shiny })}
          >
            <span className="sw" /> ✦ Shiny
          </button>
          <button
            className="w-8.5 h-8.5 grid place-items-center rounded-lg bg-surface border border-line text-muted hover:text-ink hover:border-muted"
            onClick={onClose}
            aria-label="Close editor"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1.1fr_1fr] max-[1180px]:grid-cols-1">
        <div className="px-5 py-5 flex flex-col gap-5">
          <ItemPicker value={member.itemId} onChange={(itemId) => onChange({ itemId })} />
          <AbilityPicker pid={member.pid} value={member.abilityId} onChange={(abilityId) => onChange({ abilityId })} />
          <MovesEditor
            moveIds={member.moveIds}
            pid={member.pid}
            onChange={(i, moveId) => {
              const moveIds = [...member.moveIds];
              moveIds[i] = moveId;
              onChange({ moveIds });
            }}
          />
        </div>
        <div className="px-5 py-5 flex flex-col gap-5 border-l border-line max-[1180px]:border-l-0 max-[1180px]:border-t">
          <NaturePicker value={member.natureId} onChange={(natureId) => onChange({ natureId })} />
          <EvIvEditor
            base={mon.baseStats}
            evs={member.evs}
            ivs={member.ivs}
            natureId={member.natureId}
            level={member.level}
            onEv={(stat: StatKey, value) => onChange({ evs: { ...member.evs, [stat]: value } })}
            onIv={(stat: StatKey, value) => onChange({ ivs: { ...member.ivs, [stat]: value } })}
            onResetEvs={() => onChange({ evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 } })}
          />
          <div className="grid grid-cols-2 gap-4 max-[620px]:grid-cols-1">
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-extrabold tracking-[0.07em] uppercase text-faint">Happiness</span>
              <div className="flex items-center gap-2">
                <input
                  type="number" min={0} max={255} value={member.happiness}
                  onChange={(e) => onChange({ happiness: Math.max(0, Math.min(255, parseInt(e.target.value, 10) || 0)) })}
                  className="w-18.5 font-mono text-[13.5px] text-center text-ink bg-input-bg border border-line rounded-lg px-1.75 py-1.75 focus:outline-none focus:border-accent"
                />
                <span className="text-[12px] text-faint">/ 255 {member.happiness >= 255 ? "(max)" : member.happiness === 0 ? "(min)" : ""}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-extrabold tracking-[0.07em] uppercase text-faint">Level</span>
              <div className="flex items-center gap-2">
                <input
                  type="number" min={1} max={100} value={member.level}
                  onChange={(e) => onChange({ level: Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 100)) })}
                  className="w-18.5 font-mono text-[13.5px] text-center text-ink bg-input-bg border border-line rounded-lg px-1.75 py-1.75 focus:outline-none focus:border-accent"
                />
                <span className="text-[12px] text-faint">std 100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-line flex flex-col bg-[color-mix(in_srgb,var(--surface-2)_55%,var(--surface))]">
        <div className="flex items-center gap-2.25 px-5.5 py-3 text-ink border-b border-line">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent shrink-0"><path d="M4 4h16v12H7l-3 3z" /></svg>
          <h4 className="text-[13px] font-extrabold tracking-[-0.01em] m-0">Set notes &amp; details</h4>
          <span className="flex-1 min-w-0 text-[11.5px] text-faint truncate">EV reasoning · move choices · matchups · synergy · alternatives</span>
          {noted && <span className="shrink-0 text-[9.5px] font-extrabold tracking-[0.04em] uppercase text-accent bg-accent-soft rounded-full px-2.25 py-0.75">saved</span>}
        </div>
        <NotesTab speciesName={mon.name} notes={notes} onChange={onNote} />
      </div>
    </div>
  );
}
