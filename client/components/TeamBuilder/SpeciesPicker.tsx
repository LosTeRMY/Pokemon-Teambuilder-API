"use client";

import { useState, useMemo } from "react";
import * as LK from "@/lib/lookups";
import type { GBPokemon } from "@/lib/gameData";
import { SpriteTile } from "@/components/ui/PokeToken";
import { TIER_LABEL } from "@/components/ui/TierBadge";
import TypeBadge from "@/components/ui/TypeBadge";

const bst = (p: GBPokemon) =>
  p.baseStats.hp + p.baseStats.atk + p.baseStats.def + p.baseStats.spa + p.baseStats.spd + p.baseStats.spe;

export default function SpeciesPicker({
  title,
  onPick,
  onClose,
}: {
  title?: string;
  onPick: (pokemon: GBPokemon) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = LK.opts.pokemons;
    if (s) {
      list = list.filter(
        (p) => p.name.toLowerCase().includes(s) || p.types.some((t) => t.includes(s)),
      );
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [q]);

  return (
    <>
      <div className="flex items-center gap-3 px-5.5 py-4.5 border-b border-line">
        <h3 className="text-[18px] font-extrabold tracking-[-0.01em] m-0 flex-1">{title || "Choose a Pokémon"}</h3>
        <button
          className="w-8.5 h-8.5 grid place-items-center rounded-lg bg-surface border border-line text-muted hover:text-ink hover:border-muted"
          onClick={onClose}
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
        </button>
      </div>
      <div className="px-2.25 py-2.25 border-b border-line sticky top-0 bg-surface">
        <input
          autoFocus
          value={q}
          placeholder="Search by name or type…"
          onChange={(e) => setQ(e.target.value)}
          className="w-full border border-line bg-input-bg rounded-lg px-2.75 py-2 text-[13.5px] text-ink focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]"
        />
      </div>
      <div className="px-5.5 pt-2 pb-5 overflow-y-auto">
        <div className="flex flex-col gap-2.5">
          {results.map((p) => (
            <button
              key={p.id}
              className="flex items-center gap-3.5 w-full text-left bg-surface border border-line rounded-[11px] px-3 py-2.25 transition-all duration-140 hover:border-accent hover:shadow-[0_6px_18px_-10px_var(--shadow-card)]"
              onClick={() => onPick(p)}
            >
              <SpriteTile slug={LK.slug(p.name)} name={p.name} types={p.types} size={44} />
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <span className="text-[15px] font-extrabold flex items-center gap-2">
                  {p.name}
                  <span className="text-[10px] font-extrabold rounded-[5px] px-1.75 py-0.5 bg-chip-bg text-muted">
                    {TIER_LABEL[p.tier] || p.tier}
                  </span>
                </span>
                <div className="flex gap-1 mt-0.5">
                  {p.types.map((t) => <TypeBadge key={t} type={t} />)}
                </div>
              </div>
              <span className="font-mono tabular-nums text-[11.5px] text-faint">BST {bst(p)}</span>
            </button>
          ))}
          {results.length === 0 && (
            <div className="py-5.5 text-center text-[13px] text-faint">No Pokémon match &ldquo;{q}&rdquo;.</div>
          )}
        </div>
      </div>
    </>
  );
}
