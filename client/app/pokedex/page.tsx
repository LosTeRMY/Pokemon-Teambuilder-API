"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useTheme } from "@/hooks/useTheme";
import { GAMEDATA } from "@/lib/gameData";
import { slug } from "@/lib/lookups";
import { weightedDexSort } from "@/lib/dex-sort";
import TypeBadge, { tc, ALL_TYPES } from "@/components/ui/TypeBadge";
import TierBadge, { TIER_HUE, TIER_LABEL } from "@/components/ui/TierBadge";

/* ── Types ─────────────────────────────────────────────────────────────────── */

type DxPokemon = {
  id: number;
  dexNum?: number;
  name: string;
  types: string[];
  tier: string;
  baseStats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
};

const DEX = GAMEDATA.pokemons as DxPokemon[];

/* ── Constants ──────────────────────────────────────────────────────────────── */

const TIER_ORDER: Record<string, number> = {
  ubers: 0, ou: 1, uu: 2, nu: 3,
};

const TIERS = ["ou", "uu", "nu"];

function bst(s: DxPokemon["baseStats"]) {
  return s.hp + s.atk + s.def + s.spa + s.spd + s.spe;
}

/* ── DexCard ────────────────────────────────────────────────────────────────── */

function DexCard({ mon }: { mon: DxPokemon }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const total = bst(mon.baseStats);
  const sp    = slug(mon.name);

  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  const grad = mon.types.length > 1
    ? `linear-gradient(135deg, ${tc(mon.types[0])} 0%, ${tc(mon.types[0])} 46%, ${tc(mon.types[1])} 54%, ${tc(mon.types[1])} 100%)`
    : tc(mon.types[0]);

  const tierHue   = TIER_HUE[mon.tier];
  const tierLabel = TIER_LABEL[mon.tier] ?? mon.tier.toUpperCase();

  return (
    <Link
      className="flex flex-col bg-surface border border-line rounded-[14px] overflow-hidden transition-[border-color,box-shadow,transform] duration-150 text-inherit hover:border-muted hover:shadow-[0_10px_26px_-14px_var(--shadow-card)] hover:-translate-y-0.75 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
      href={`/pokedex/${sp}`}
      aria-label={`${mon.name}, ${tierLabel}, ${mon.types.join(" ")}, base stat total ${total}`}
    >
      {/* Art */}
      <div
        className="relative grid place-items-center border-b border-line-soft"
        style={{ height: 142, background: "var(--tile)" }}
      >
        <span className="absolute top-2.75 left-3.25 text-[12px] font-bold text-faint font-mono">
          #{String(mon.dexNum ?? mon.id).padStart(3, "0")}
        </span>
        <div className="relative" style={{ width: 92, height: 92 }}>
          <div
            className="absolute inset-0 grid place-items-center rounded-xl text-white font-extrabold text-center leading-[1.1] [text-shadow:0_1px_2px_rgba(0,0,0,0.32)] p-1.5 transition-opacity duration-250"
            style={{ background: grad, fontSize: Math.max(9, Math.round(92 * 0.15)), opacity: loaded ? 0 : 1 }}
          >
            <span>{mon.name}</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            className="absolute inset-0 w-full h-full object-contain scale-[1.18] [image-rendering:-webkit-optimize-contrast] transition-opacity duration-250"
            src={`/sprites/gen4/${sp}.png`}
            alt=""
            loading="lazy"
            style={{ opacity: loaded ? 1 : 0 }}
            onLoad={() => setLoaded(true)}
          />
        </div>
      </div>

      {/* Body */}
      <div className="pt-3.25 px-4 pb-3.75 flex flex-col gap-2.25">
        <div className="flex items-center gap-2">
          <h3 className="text-[17px] font-bold tracking-[-0.01em] m-0 flex-1 whitespace-nowrap overflow-hidden text-ellipsis">
            {mon.name}
          </h3>
          {tierHue && <TierBadge hue={tierHue}>{tierLabel}</TierBadge>}
        </div>
        <div className="flex gap-1.5">
          {mon.types.map((t) => <TypeBadge key={t} type={t} />)}
        </div>
        <div className="text-[12.5px] text-faint tracking-[0.02em] mt-px font-mono">
          BST <b className="text-muted font-bold">{total}</b>
        </div>
      </div>
    </Link>
  );
}

/* ── TypeFilter ─────────────────────────────────────────────────────────────── */

function TypeFilter({
  selected,
  onToggle,
  onClear,
}: {
  selected: Set<string>;
  onToggle: (t: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const n = selected.size;
  const active = n > 0 || open;

  return (
    <div className="relative" ref={ref}>
      <button
        className={`inline-flex items-center gap-2 whitespace-nowrap px-3.5 py-2.25 border rounded-[9px] bg-surface text-[13.5px] font-bold transition-all duration-130 leading-none cursor-pointer hover:border-muted ${active ? "border-accent text-accent bg-accent-soft" : "border-line text-ink"}`}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 5h18l-7 8v6l-4 2v-8z" />
        </svg>
        Type
        {n > 0 && (
          <span className="bg-accent text-white text-[11px] font-bold rounded-full px-1.75 py-px font-mono">
            {n}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-[calc(100%+8px)] right-0 max-[900px]:right-auto max-[900px]:left-0 z-40 w-[320px] p-3.5 bg-surface border border-line rounded-xl shadow-[0_18px_40px_-14px_var(--shadow-pop)]">
          <div className="flex items-center justify-between mb-2.75">
            <span className="text-[11.5px] font-bold tracking-wider uppercase text-faint">
              Filter by type · has all
            </span>
            {n > 0 && (
              <button
                className="bg-transparent border-0 text-accent text-[12px] font-bold p-0 cursor-pointer"
                onClick={onClear}
              >
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 gap-1.75">
            {ALL_TYPES.map((t) => {
              const on = selected.has(t);
              return (
                <button
                  key={t}
                  className={`flex items-center gap-1.75 px-2.25 py-1.75 rounded-lg border-[1.5px] border-transparent text-[12.5px] font-bold capitalize cursor-pointer transition-all duration-120 hover:bg-chip-bg ${on ? "text-white" : "bg-surface-2 text-muted"}`}
                  style={on ? { background: tc(t), borderColor: tc(t) } : undefined}
                  onClick={() => onToggle(t)}
                >
                  {!on && (
                    <i
                      className="w-2.75 h-2.75 rounded-full shrink-0 not-italic"
                      style={{ background: tc(t) }}
                    />
                  )}
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default function PokedexPage() {
  const { theme, toggle } = useTheme();
  const [q,    setQ]    = useState("");
  const [tier, setTier] = useState<string | null>(null);
  const [types, setTypes] = useState<Set<string>>(new Set());
  const [sort,  setSort]  = useState("featured");
  const [featured] = useState(() => weightedDexSort(DEX));

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const base = sort === "featured" ? featured : DEX;
    const r = base.filter((m) => {
      if (s && !m.name.toLowerCase().includes(s)) return false;
      if (tier && m.tier !== tier) return false;
      for (const ty of types) if (!m.types.includes(ty)) return false;
      return true;
    });
    if (sort === "featured") return r;
    return [...r].sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) :
      sort === "bst"  ? bst(b.baseStats) - bst(a.baseStats) || a.id - b.id :
      sort === "tier" ? (TIER_ORDER[a.tier] ?? 9) - (TIER_ORDER[b.tier] ?? 9) || a.id - b.id :
      a.id - b.id
    );
  }, [q, tier, types, sort, featured]);

  const toggleType = (ty: string) =>
    setTypes((prev) => { const n = new Set(prev); n.has(ty) ? n.delete(ty) : n.add(ty); return n; });
  const clearTypes = () => setTypes(new Set());
  const removeType = (ty: string) =>
    setTypes((prev) => { const n = new Set(prev); n.delete(ty); return n; });

  return (
    <>
      <Navbar theme={theme} onThemeToggle={toggle} />

      <main className="max-w-335 mx-auto px-10 pt-8.5 pb-27.5 max-[900px]:px-4 max-[900px]:pt-5.5 max-[900px]:pb-22.5">

        {/* ── Header ── */}
        <div className="mb-5.5">
          <h1 className="text-[30px] font-extrabold tracking-tight m-0 mb-1">Pokédex</h1>
          <p className="m-0 text-[14.5px] text-muted">
            Generation IV (DPP) · <b className="text-ink font-bold">Smogon competitive movesets &amp; analysis</b>
          </p>
        </div>

        {/* ── Filters ── */}
        <div className="flex items-center gap-3 flex-wrap mb-4 max-[560px]:gap-2.25">

          {/* Search */}
          <div className="relative flex-[1_1_280px] min-w-55">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
              viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              className="w-full py-3 pr-3.5 pl-10 border border-line rounded-[10px] text-[15px] font-sans text-ink bg-input-bg outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-faint focus:border-accent focus:bg-surface focus:shadow-[0_0_0_3px_var(--accent-soft)]"
              placeholder="Search Pokémon…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* Tier buttons — single-select radio style */}
          <div className="flex gap-1.5">
            <button
              className={`px-3.5 py-2.25 border rounded-[9px] text-[13.5px] font-bold transition-all duration-130 leading-none cursor-pointer hover:border-muted hover:text-ink ${tier === null ? "text-white border-(--th) bg-(--th)" : "bg-surface border-line text-muted"}`}
              style={{ "--th": "var(--accent)" } as React.CSSProperties}
              onClick={() => setTier(null)}
            >
              All
            </button>
            {TIERS.map((tr) => (
              <button
                key={tr}
                className={`px-3.5 py-2.25 border rounded-[9px] text-[13.5px] font-bold transition-all duration-130 leading-none cursor-pointer hover:border-muted hover:text-ink ${tier === tr ? "text-white border-(--th) bg-(--th)" : "bg-surface border-line text-muted"}`}
                style={{ "--th": TIER_HUE[tr] } as React.CSSProperties}
                onClick={() => setTier((cur) => (cur === tr ? null : tr))}
              >
                {TIER_LABEL[tr]}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <TypeFilter selected={types} onToggle={toggleType} onClear={clearTypes} />

          {/* Sort */}
          <div className="flex items-center gap-1.75 max-[560px]:hidden">
            <label className="text-[10.5px] text-faint tracking-[0.08em] font-mono">SORT</label>
            <select
              className="font-sans text-[13.5px] font-semibold text-ink border border-line rounded-[9px] px-2.75 py-2.25 bg-surface cursor-pointer focus:outline-none focus:border-accent"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="dex">National №</option>
              <option value="name">Name A–Z</option>
              <option value="bst">Base stat total</option>
              <option value="tier">Tier</option>
            </select>
          </div>
        </div>

        {/* ── Active type pills ── */}
        {types.size > 0 && (
          <div className="flex flex-wrap gap-1.75 items-center mb-4">
            {[...types].map((ty) => (
              <span
                key={ty}
                className="inline-flex items-center gap-1.5 text-white rounded-full py-1 pl-2.75 pr-1.75 text-[12px] font-bold capitalize"
                style={{ background: tc(ty) }}
              >
                {ty}
                <button
                  className="bg-transparent border-0 text-white/80 text-[11px] p-0 px-0.5 leading-none cursor-pointer hover:text-white"
                  onClick={() => removeType(ty)}
                  aria-label={"remove " + ty}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {/* ── Count ── */}
        <div className="text-[13.5px] text-faint mb-3.5">
          <b className="text-ink font-bold">{filtered.length}</b> Pokémon
        </div>

        {/* ── Grid ── */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(198px,1fr))] gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-17.5 px-5 text-muted flex flex-col items-center gap-3.5">
              <p className="m-0 text-[15px]">No Pokémon match these filters.</p>
              <p className="m-0 text-[13px] text-faint">Try clearing the type or tier filter.</p>
            </div>
          ) : (
            filtered.map((m) => <DexCard key={m.id} mon={m} />)
          )}
        </div>
      </main>
    </>
  );
}
