"use client";

import "./page.css";
import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { useTheme } from "@/hooks/useTheme";
import { GAMEDATA } from "@/lib/gameData";
import { slug } from "@/lib/lookups";
import { weightedDexSort } from "@/lib/dex-sort";

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

const TYPE_COLORS: Record<string, string> = {
  normal:   "#a0a29f",
  fire:     "#e8554e",
  water:    "#538cce",
  electric: "#eed535",
  grass:    "#5db85c",
  ice:      "#74c5c5",
  fighting: "#cc3f3a",
  poison:   "#a55fa5",
  ground:   "#d97845",
  flying:   "#90a8dc",
  psychic:  "#e95e7d",
  bug:      "#91a119",
  rock:     "#c5b488",
  ghost:    "#5269ac",
  dragon:   "#5462d6",
  dark:     "#595761",
  steel:    "#5d93a5",
};

const ALL_TYPES = [
  "normal", "fire",    "water",
  "electric","grass",  "ice",
  "fighting","poison", "ground",
  "flying",  "psychic","bug",
  "rock",    "ghost",  "dragon",
  "dark",    "steel",
];

const TIER_HUE: Record<string, string> = {
  ubers: "#7a3fd0",
  ou:    "#2f6fe0",
  uu:    "#2f9a55",
  nu:    "#d07f2a",
  nubl:  "#b8731a",
  pu:    "#8e6bbf",
  publ:  "#7a5aa8",
  zubl:  "#5a5a7a",
  lc:    "#2a9dbf",
};

const TIER_LABEL: Record<string, string> = {
  ubers: "Uber", ou: "OU", uu: "UU", nu: "NU",
  nubl: "NUBL", pu: "PU", publ: "PUBL", zubl: "ZUBL", lc: "LC",
};

const TIER_ORDER: Record<string, number> = {
  ubers: 0, ou: 1, uu: 2, nu: 3,
};

const TIERS = ["ou", "uu", "nu"];

const tc = (t: string) => TYPE_COLORS[t] ?? "#888";

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
      className="dx-card"
      href={`/pokemon/${sp}`}
      aria-label={`${mon.name}, ${tierLabel}, ${mon.types.join(" ")}, base stat total ${total}`}
    >
      {/* Art */}
      <div className="dx-art" style={{ height: 142, background: "var(--tile)" }}>
        <span className="dx-num mono">#{String(mon.dexNum ?? mon.id).padStart(3, "0")}</span>
        <div className="dx-sprite" style={{ width: 92, height: 92 }}>
          <div
            className="dx-sprite-ph"
            style={{ background: grad, fontSize: Math.max(9, Math.round(92 * 0.15)), opacity: loaded ? 0 : 1 }}
          >
            <span>{mon.name}</span>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            className="dx-sprite-img"
            src={`/sprites/gen4/${sp}.png`}
            alt=""
            loading="lazy"
            style={{ opacity: loaded ? 1 : 0 }}
            onLoad={() => setLoaded(true)}
          />
        </div>
      </div>

      {/* Body */}
      <div className="dx-body">
        <div className="dx-titlerow">
          <h3 className="dx-name">{mon.name}</h3>
          {tierHue && (
            <span className="tier-badge" style={{ "--th": tierHue } as React.CSSProperties}>
              {tierLabel}
            </span>
          )}
        </div>
        <div className="dx-types">
          {mon.types.map((t) => (
            <span key={t} className="dx-type" style={{ background: tc(t) }}>{t}</span>
          ))}
        </div>
        <div className="dx-bst mono">BST <b>{total}</b></div>
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
  return (
    <div className="dx-typewrap" ref={ref}>
      <button
        className={"dx-typebtn" + (n > 0 || open ? " dx-typebtn--on" : "")}
        onClick={() => setOpen((o) => !o)}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 5h18l-7 8v6l-4 2v-8z" />
        </svg>
        Type
        {n > 0 && <span className="dx-typebtn-n mono">{n}</span>}
      </button>

      {open && (
        <div className="dx-typemenu">
          <div className="dx-typemenu-head">
            <span>Filter by type · has all</span>
            {n > 0 && <button onClick={onClear}>Clear</button>}
          </div>
          <div className="dx-typegrid">
            {ALL_TYPES.map((t) => {
              const on = selected.has(t);
              return (
                <button
                  key={t}
                  className={"dx-typechip" + (on ? " dx-typechip--on" : "")}
                  style={on ? { background: tc(t), borderColor: tc(t) } : undefined}
                  onClick={() => onToggle(t)}
                >
                  {!on && <i style={{ background: tc(t) }} />}
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

  const toggleType  = (ty: string) => setTypes((prev) => { const n = new Set(prev); n.has(ty) ? n.delete(ty) : n.add(ty); return n; });
  const clearTypes  = () => setTypes(new Set());
  const removeType  = (ty: string) => setTypes((prev) => { const n = new Set(prev); n.delete(ty); return n; });

  return (
    <>
      <Navbar theme={theme} onThemeToggle={toggle} />

      <main className="dx-page">

        {/* ── Header ── */}
        <div className="dx-head">
          <h1>Pokédex</h1>
          <p>Generation IV (DPP) · <b>Smogon competitive movesets &amp; analysis</b></p>
        </div>

        {/* ── Filters ── */}
        <div className="dx-filters">

          {/* Search */}
          <div className="dx-search">
            <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              placeholder="Search Pokémon…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          {/* Tier buttons — single-select radio style */}
          <div className="dx-tiers">
            <button
              className={"dx-tier" + (tier === null ? " dx-tier--on" : "")}
              style={{ "--th": "var(--accent)" } as React.CSSProperties}
              onClick={() => setTier(null)}
            >
              All
            </button>
            {TIERS.map((tr) => (
              <button
                key={tr}
                className={"dx-tier" + (tier === tr ? " dx-tier--on" : "")}
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
          <div className="dx-sort">
            <label className="mono">SORT</label>
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
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
          <div className="dx-active">
            {[...types].map((ty) => (
              <span key={ty} className="dx-active-pill" style={{ background: tc(ty) }}>
                {ty}
                <button onClick={() => removeType(ty)} aria-label={"remove " + ty}>✕</button>
              </span>
            ))}
          </div>
        )}

        {/* ── Count ── */}
        <div className="dx-count"><b>{filtered.length}</b> Pokémon</div>

        {/* ── Grid ── */}
        <div className="dx-grid">
          {filtered.length === 0 ? (
            <div className="dx-empty">
              <p>No Pokémon match these filters.</p>
              <p className="dx-empty-sub">Try clearing the type or tier filter.</p>
            </div>
          ) : (
            filtered.map((m) => <DexCard key={m.id} mon={m} />)
          )}
        </div>
      </main>
    </>
  );
}
