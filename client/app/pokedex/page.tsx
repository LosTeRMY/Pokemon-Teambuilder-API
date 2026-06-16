"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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

const DEX = GAMEDATA.pokemons as unknown as DxPokemon[];

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
    <a
      className="dx-card"
      tabIndex={0}
      role="button"
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
    </a>
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
      <style>{`
        /* ── Pokédex-specific classes (not yet in globals.css) ── */
        .dx-page { max-width: 1340px; margin: 0 auto; padding: 34px 40px 110px; }
        .dx-head { margin-bottom: 22px; }
        .dx-head h1 { font-size: 30px; font-weight: 800; letter-spacing: -0.025em; margin: 0 0 4px; }
        .dx-head p  { margin: 0; font-size: 14.5px; color: var(--muted); }
        .dx-head p b { color: var(--ink); font-weight: 700; }

        .dx-filters { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }

        .dx-search { position: relative; flex: 1 1 280px; min-width: 220px; }
        .dx-search svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--faint); pointer-events: none; }
        .dx-search input { width: 100%; padding: 12px 14px 12px 40px; border: 1px solid var(--line); border-radius: 10px; font-size: 15px; font-family: inherit; color: var(--ink); background: var(--input-bg); outline: none; transition: border-color .15s, box-shadow .15s; }
        .dx-search input::placeholder { color: var(--faint); }
        .dx-search input:focus { border-color: var(--accent); background: var(--surface); box-shadow: 0 0 0 3px var(--accent-soft); }

        .dx-tiers { display: flex; gap: 6px; }
        .dx-tier { padding: 9px 14px; border: 1px solid var(--line); border-radius: 9px; background: var(--surface); font-size: 13.5px; font-weight: 700; color: var(--muted); transition: all .13s; line-height: 1; cursor: pointer; }
        .dx-tier:hover { border-color: var(--muted); color: var(--ink); }
        .dx-tier--on { color: #fff; border-color: var(--th); background: var(--th); }

        .dx-typewrap { position: relative; }
        .dx-typebtn { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; padding: 9px 14px; border: 1px solid var(--line); border-radius: 9px; background: var(--surface); font-size: 13.5px; font-weight: 700; color: var(--ink); transition: all .13s; line-height: 1; cursor: pointer; }
        .dx-typebtn:hover { border-color: var(--muted); }
        .dx-typebtn--on { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
        .dx-typebtn-n { background: var(--accent); color: #fff; font-size: 11px; font-weight: 700; border-radius: 20px; padding: 1px 7px; }
        .dx-typemenu { position: absolute; top: calc(100% + 8px); right: 0; z-index: 40; width: 320px; padding: 14px; background: var(--surface); border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 18px 40px -14px var(--shadow-pop); }
        .dx-typemenu-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 11px; }
        .dx-typemenu-head span { font-size: 11.5px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--faint); }
        .dx-typemenu-head button { background: none; border: none; color: var(--accent); font-size: 12px; font-weight: 700; padding: 0; cursor: pointer; }
        .dx-typegrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
        .dx-typechip { display: flex; align-items: center; gap: 7px; padding: 7px 9px; border-radius: 8px; border: 1.5px solid transparent; background: var(--surface-2); font-size: 12.5px; font-weight: 700; color: var(--muted); text-transform: capitalize; cursor: pointer; transition: all .12s; }
        .dx-typechip i { width: 11px; height: 11px; border-radius: 50%; flex: 0 0 auto; display: inline-block; }
        .dx-typechip:hover { background: var(--chip-bg); }
        .dx-typechip--on { color: #fff; }

        .dx-sort { display: flex; align-items: center; gap: 7px; }
        .dx-sort label { font-size: 10.5px; color: var(--faint); letter-spacing: 0.08em; }
        .dx-sort select { font-family: inherit; font-size: 13.5px; font-weight: 600; color: var(--ink); border: 1px solid var(--line); border-radius: 9px; padding: 9px 11px; background: var(--surface); cursor: pointer; }
        .dx-sort select:focus { outline: none; border-color: var(--accent); }

        .dx-active { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; margin-bottom: 16px; }
        .dx-active-pill { display: inline-flex; align-items: center; gap: 6px; color: #fff; border-radius: 20px; padding: 4px 7px 4px 11px; font-size: 12px; font-weight: 700; text-transform: capitalize; }
        .dx-active-pill button { background: none; border: none; color: rgba(255,255,255,.8); font-size: 11px; padding: 0 2px; line-height: 1; cursor: pointer; }
        .dx-active-pill button:hover { color: #fff; }

        .dx-count { font-size: 13.5px; color: var(--faint); margin-bottom: 14px; }
        .dx-count b { color: var(--ink); font-weight: 700; }

        .dx-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(198px, 1fr)); gap: 16px; }

        .dx-card { display: flex; flex-direction: column; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; cursor: pointer; transition: border-color .15s, box-shadow .15s, transform .15s; text-decoration: none; color: inherit; }
        .dx-card:hover { border-color: var(--muted); box-shadow: 0 10px 26px -14px var(--shadow-card); transform: translateY(-3px); }
        .dx-card:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

        .dx-art { position: relative; display: grid; place-items: center; border-bottom: 1px solid var(--line-soft); }
        .dx-num { position: absolute; top: 11px; left: 13px; font-size: 12px; font-weight: 700; color: var(--faint); }
        .dx-sprite { position: relative; }
        .dx-sprite-ph { position: absolute; inset: 0; display: grid; place-items: center; border-radius: 12px; color: #fff; font-weight: 800; text-align: center; line-height: 1.1; text-shadow: 0 1px 2px rgba(0,0,0,.32); padding: 6px; transition: opacity .25s; }
        .dx-sprite-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; transform: scale(1.18); image-rendering: -webkit-optimize-contrast; transition: opacity .25s; }

        .dx-body { padding: 13px 16px 15px; display: flex; flex-direction: column; gap: 9px; }
        .dx-titlerow { display: flex; align-items: center; gap: 8px; }
        .dx-name { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; margin: 0; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dx-types { display: flex; gap: 6px; }
        .dx-type { color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 0.01em; padding: 3px 9px; border-radius: 6px; text-transform: capitalize; }
        .dx-bst { font-size: 12.5px; color: var(--faint); letter-spacing: 0.02em; margin-top: 1px; }
        .dx-bst b { color: var(--muted); font-weight: 700; }

        .dx-empty { grid-column: 1 / -1; text-align: center; padding: 70px 20px; color: var(--muted); display: flex; flex-direction: column; align-items: center; gap: 14px; }
        .dx-empty p { margin: 0; font-size: 15px; }
        .dx-empty-sub { font-size: 13px !important; color: var(--faint); }

        @media (max-width: 900px) {
          .dx-page { padding: 22px 16px 90px; }
          .dx-typemenu { right: auto; left: 0; }
        }
        @media (max-width: 560px) {
          .dx-filters { gap: 9px; }
          .dx-sort { display: none; }
        }
      `}</style>

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
