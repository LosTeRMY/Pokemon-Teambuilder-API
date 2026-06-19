"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import * as LK from "@/lib/lookups";
import { tc } from "@/lib/browserUtils";
import type { GBMove } from "@/lib/gameData";
import { cn } from "@/lib/cn";

const CAT_LABEL: Record<GBMove["category"], string> = { physical: "Physical", special: "Special", status: "Status" };
const CAT_SHORT: Record<GBMove["category"], string> = { physical: "Phys", special: "Spec", status: "Sta" };
const CAT_COLOR: Record<GBMove["category"], string> = { physical: "#c0392b", special: "#4257b2", status: "#7c8694" };

function CatBadge({ category }: { category: GBMove["category"] }) {
  return (
    <span
      className="shrink-0 text-[9px] font-extrabold uppercase tracking-[0.03em] text-white rounded leading-[1.2] px-1.25 py-0.5"
      style={{ background: CAT_COLOR[category] }}
    >
      {CAT_SHORT[category]}
    </span>
  );
}

function TypeMini({ type }: { type: string }) {
  return (
    <span className="w-5.5 h-5.5 rounded-md grid place-items-center" style={{ background: tc(type) }} title={type}>
      <span className="text-[0px]">{type}</span>
    </span>
  );
}

function MoveSlot({
  index,
  moveId,
  pid,
  chosen,
  open,
  onToggle,
  onPick,
}: {
  index: number;
  moveId: number | null;
  pid: number;
  chosen: Set<number>;
  open: boolean;
  onToggle: () => void;
  onPick: (id: number | null) => void;
}) {
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const move = moveId != null ? LK.moveById.get(moveId) : null;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggle();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    if (!open) { setQ(""); setHi(0); }
    onToggle();
  };

  const learn = useMemo(() => LK.movesForPokemon(pid), [pid]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? learn.filter((m) => m.name.toLowerCase().includes(s)) : learn;
  }, [q, learn]);

  const pick = (id: number) => { onPick(id); setHi(0); };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[hi]) pick(filtered[hi].id); }
  };

  const fmt = (v: number | null) => (v == null ? "—" : v);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={cn(
          "flex items-center gap-2.75 w-full text-left bg-input-bg border rounded-[9px] px-3 py-2.25 transition-all duration-140 relative",
          open ? "border-accent shadow-[0_0_0_3px_var(--accent-soft)] bg-surface" : "border-line hover:border-muted",
        )}
        onClick={toggle}
      >
        <span className="shrink-0 w-5 h-5 rounded-md bg-chip-bg text-faint text-[11px] font-extrabold grid place-items-center font-mono">{index + 1}</span>
        <span className="w-5.5 h-5.5 rounded-md shrink-0" style={{ background: move ? tc(move.type) : "var(--line)" }} />
        <span className="flex-1 min-w-0 flex flex-col gap-px">
          <span className={cn("text-[14px] truncate", move ? "font-bold" : "font-medium italic text-faint")}>{move?.name ?? "Add a move"}</span>
          {move ? (
            <span className="text-[11px] text-muted truncate">{move.type} · {CAT_LABEL[move.category]}</span>
          ) : (
            <span className="text-[11px] text-muted truncate">Choose from {learn.length} learnable moves</span>
          )}
        </span>
        {move && move.category !== "status" && (
          <span className="flex gap-2.25 shrink-0 font-mono text-[11px] text-muted">
            <span><b className="text-ink font-bold">{fmt(move.power)}</b> BP</span>
            <span><b className="text-ink font-bold">{fmt(move.accuracy)}</b> Acc</span>
          </span>
        )}
        {move && (
          <span
            role="button"
            aria-label="Clear move"
            className="shrink-0 text-faint p-0.5 grid place-items-center rounded-[5px] hover:text-like-fg hover:bg-like-bg"
            onClick={(e) => { e.stopPropagation(); onPick(null); }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </span>
        )}
      </button>
      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-60 bg-surface border border-line rounded-[11px] shadow-[0_22px_50px_-16px_var(--shadow-pop)] overflow-hidden flex flex-col max-h-95 motion-safe:animate-[tbMenuIn_0.14s_ease]">
          <div className="p-2.25 border-b border-line sticky top-0 bg-surface">
            <input
              autoFocus
              value={q}
              placeholder="Search learnable moves…"
              onChange={(e) => { setQ(e.target.value); setHi(0); }}
              onKeyDown={onKey}
              className="w-full border border-line bg-input-bg rounded-lg px-2.75 py-2 text-[13.5px] text-ink focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]"
            />
          </div>
          <div className="grid grid-cols-[22px_1fr_60px_42px_42px_34px] items-center gap-2.5 px-3 pt-1.25 pb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-faint">
            <span /><span>Move</span><span>Cat</span><span>Pwr</span><span>Acc</span><span>PP</span>
          </div>
          <div className="overflow-y-auto p-1.25">
            {filtered.length === 0 && (
              <div className="p-5.5 text-center text-[13px] text-faint">No learnable moves match &ldquo;{q}&rdquo;.</div>
            )}
            {filtered.slice(0, 60).map((m, i) => {
              const isChosen = chosen.has(m.id) && m.id !== moveId;
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={isChosen}
                  className={cn(
                    "grid grid-cols-[22px_1fr_60px_42px_42px_34px] items-center gap-2.5 w-full text-left rounded-lg px-3 py-1.75",
                    isChosen && "opacity-40 cursor-not-allowed",
                    // .sel (current move) takes priority over .hi (keyboard highlight) over plain hover, matching the mockup's CSS source order.
                    m.id === moveId ? "bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))]" : i === hi ? "bg-accent-soft" : "hover:bg-accent-soft",
                  )}
                  onMouseEnter={() => setHi(i)}
                  onClick={() => { if (!isChosen) pick(m.id); }}
                >
                  <TypeMini type={m.type} />
                  <span className="flex flex-col gap-px min-w-0">
                    <b className="text-[13.5px] font-bold truncate">{m.name}{isChosen ? " ✓" : ""}</b>
                  </span>
                  <span className="grid place-items-center"><CatBadge category={m.category} /></span>
                  <span className="font-mono text-[12px] font-semibold text-ink text-center">{fmt(m.power)}</span>
                  <span className="font-mono text-[12px] font-semibold text-ink text-center">{fmt(m.accuracy)}</span>
                  <span className="font-mono text-[11.5px] text-muted text-center">{m.pp}</span>
                  {m.description && (
                    <span className="col-[2/-1] text-[11.5px] text-muted leading-[1.35] pt-0.5">{m.description}</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between px-3 py-1.75 border-t border-line text-[11px] text-faint bg-surface-2">
            <span>{filtered.length} moves</span><span>Legal in Gen 4 learnset</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MovesEditor({
  moveIds,
  pid,
  onChange,
}: {
  moveIds: (number | null)[];
  pid: number;
  onChange: (index: number, moveId: number | null) => void;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const chosenCount = moveIds.filter(Boolean).length;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-extrabold tracking-[0.07em] uppercase text-faint flex items-center justify-between">
        Moves <em className="font-semibold not-italic normal-case tracking-normal text-muted text-[11.5px]">{chosenCount}/4 chosen</em>
      </span>
      <div className="flex flex-col gap-2">
        {moveIds.map((id, i) => {
          const chosen = new Set(moveIds.filter((mid): mid is number => mid != null));
          return (
            <MoveSlot
              key={i}
              index={i}
              moveId={id}
              pid={pid}
              chosen={chosen}
              open={openIndex === i}
              onToggle={() => setOpenIndex((cur) => (cur === i ? null : i))}
              onPick={(moveId) => { onChange(i, moveId); setOpenIndex(null); }}
            />
          );
        })}
      </div>
    </div>
  );
}
