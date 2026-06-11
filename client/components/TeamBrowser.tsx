"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { GAMEDATA } from "@/lib/gameData";
import * as LK from "@/lib/lookups";
import type { FilterState, Combo } from "@/lib/lookups";
import type { GBMove, GBAbility, GBItem, GBNature, GBPokemon } from "@/lib/gameData";
import { MOCK_TEAMS } from "@/lib/mockData";
import type { BrowserTeam, BrowserMember } from "@/lib/mockData";

/* ─── Constants ─── */
const spriteUrl = (s: string) => `/sprites/gen4/${s}.png`;

const TYPE_COLORS: Record<string, string> = {
  normal: "#9b9a6e", fire: "#e8702a", water: "#4b7bd8", electric: "#e8c020",
  grass: "#5aa83e", ice: "#5cc0c0", fighting: "#c0392b", poison: "#9b3f9b",
  ground: "#cba84a", flying: "#8a7be0", psychic: "#e84d7a", bug: "#8a9a18",
  rock: "#a08a2e", ghost: "#5e4a86", dragon: "#5a2fd8", dark: "#5a4a3f",
  steel: "#8a8aa8",
};

const TIER_HUE: Record<string, string> = {
  ubers: "#7a3fd0", ou: "#2f6fe0", uu: "#2f9a55", nu: "#d07f2a", pu: "#64748b", lc: "#2a9aa0",
};

const KIND_LABEL: Record<string, string> = { move: "move", item: "item", ability: "ability", nature: "nature" };

const EMPTY: FilterState = {
  name: "", format: null, pokemon: [], move: [], ability: [], item: [],
  combos: [], likedBy: false, sort: "newest", page: 1,
};

/* ─── Helpers ─── */
const tc = (t: string) => TYPE_COLORS[t] || "#888";
const fmtName = (id: number) => LK.fmtById.get(id)?.name || String(id);
const fmtTier = (id: number) => LK.fmtById.get(id)?.tier || "pu";
const tierHue = (id: number) => TIER_HUE[fmtTier(id)] || "#64748b";

const comboValName = (c: Combo) => {
  const map: Record<string, Map<number, { name: string }>> = {
    move: LK.moveById as Map<number, { name: string }>,
    item: LK.itemById as Map<number, { name: string }>,
    ability: LK.abilById as Map<number, { name: string }>,
    nature: LK.natById as Map<number, { name: string }>,
  };
  return map[c.kind].get(c.vid)?.name || String(c.vid);
};

const relDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  const days = Math.round((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  if (days < 60) return "1mo ago";
  return `${Math.floor(days / 30)}mo ago`;
};

function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `oklch(0.7 0.11 ${h})`;
}

/* ─── SpriteTile ─── */
function SpriteTile({ slug, name, types, size, round }: {
  slug: string; name: string; types: string[]; size: number; round?: boolean;
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);
  const grad = types.length > 1
    ? `linear-gradient(135deg, ${tc(types[0])} 0%, ${tc(types[0])} 48%, ${tc(types[1])} 52%, ${tc(types[1])} 100%)`
    : tc(types[0]);
  return (
    <div className={"spr" + (round ? " spr--round" : "")} style={{ width: size, height: size }} title={name}>
      <div className="spr-ph" style={{ background: grad, fontSize: Math.max(7, Math.round(size * 0.17)) }}>
        {size >= 36 && <span>{name}</span>}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={imgRef} className="spr-img" src={spriteUrl(slug)} alt={name}
        style={{ opacity: loaded ? 1 : 0 }} onLoad={() => setLoaded(true)} />
    </div>
  );
}

function PokeToken({ pid, size }: { pid: number; size: number }) {
  const p = LK.pokeById.get(pid);
  if (!p) return <div className="spr" style={{ width: size, height: size, background: "#cdd3dc" }} />;
  return <SpriteTile slug={LK.slug(p.name)} name={p.name} types={p.types} size={size} round />;
}

/* ─── MonSlot (pokemon card slot with hover popup) ─── */
function MonSlot({ mon, size }: { mon: BrowserMember; size: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mon" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((o) => !o)}>
      <div className="mon-frame" style={{ borderBottomColor: tc(mon.t[0]) }}>
        <SpriteTile slug={mon.s} name={mon.n} types={mon.t} size={size} />
      </div>
      {open && (
        <div className="mon-pop">
          <div className="mon-pop-head">
            <strong>{mon.n}</strong>
            <span className="mon-pop-types">
              {mon.t.map((t) => <em key={t} style={{ background: tc(t) }}>{t}</em>)}
            </span>
          </div>
          <div className="mon-pop-meta">
            <span>@ {mon.item}</span>
            <span>{mon.abil}</span>
            <span>{mon.nat}</span>
          </div>
          <ul className="mon-pop-moves">
            {mon.moves.map((mv) => <li key={mv}>{mv}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── TeamCard ─── */
function TeamCard({ team, onLike }: { team: BrowserTeam; onLike: (id: number) => void }) {
  const SIZE = 76;
  return (
    <article className="card">
      <div className="card-head">
        <span className="tier-badge" style={{ "--th": tierHue(team.format) } as React.CSSProperties}>
          {fmtName(team.format)}
        </span>
        <h3 className="card-title">{team.name}</h3>
        <button className={"like" + (team.liked ? " like--on" : "")} onClick={() => onLike(team.id)} aria-label="Like team">
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <path d="M12 21s-7.5-4.9-10-9.3C.4 8.4 2.2 5 5.6 5c2 0 3.3 1.2 4 2.3.7-1.1 2-2.3 4-2.3 3.4 0 5.2 3.4 3.6 6.7C19.5 16.1 12 21 12 21z"
              fill={team.liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          </svg>
          <span className="mono">{team.likes}</span>
        </button>
      </div>

      {team.description && <p className="card-desc">{team.description}</p>}

      <div className="card-foot">
        <div className="mon-row">
          {team.members.map((mon, i) => <MonSlot key={i} mon={mon} size={SIZE} />)}
        </div>
        <div className="byline">
          <span className="avatar" style={{ background: avatarColor(team.author.name) }}>
            {team.author.name[0].toUpperCase()}
          </span>
          <div className="byline-txt">
            <span className="author">{team.author.name}</span>
            <span className="date mono">{relDate(team.createdAt)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ─── AutoComplete ─── */
function AutoComplete({ placeholder, options, onPick, exclude, small }: {
  placeholder: string;
  options: Array<{ id: number; name: string }>;
  onPick: (id: number, name: string) => void;
  exclude?: Set<number>;
  small?: boolean;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const ex = exclude || new Set<number>();

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = options.filter((o) => !ex.has(o.id));
    if (s) {
      list = list.filter((o) => o.name.toLowerCase().includes(s)).sort((a, b) => {
        const ai = a.name.toLowerCase().startsWith(s) ? 0 : 1;
        const bi = b.name.toLowerCase().startsWith(s) ? 0 : 1;
        return ai - bi || a.name.localeCompare(b.name);
      });
    }
    return list.slice(0, 8);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, options, exclude?.size]);

  const pick = (o: { id: number; name: string } | undefined) => {
    if (!o) return;
    onPick(o.id, o.name);
    setQ(""); setOpen(false); setHi(0);
  };

  return (
    <div className="ac">
      <input
        className={"text-input" + (small ? " text-input--sm" : "")}
        placeholder={placeholder}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 130)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => Math.min(h + 1, matches.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
          else if (e.key === "Enter") { e.preventDefault(); pick(matches[hi]); }
          else if (e.key === "Escape") { setOpen(false); }
        }}
      />
      {open && matches.length > 0 && (
        <ul className="ac-menu">
          {matches.map((o, i) => (
            <li key={o.id} className={"ac-item" + (i === hi ? " ac-item--hi" : "")}
              onMouseDown={(e) => { e.preventDefault(); pick(o); }}
              onMouseEnter={() => setHi(i)}>
              {o.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function VChip({ label, onX }: { label: string; onX: () => void }) {
  return (
    <span className="vchip">
      {label}
      <button onMouseDown={(e) => { e.preventDefault(); onX(); }} aria-label="remove">✕</button>
    </span>
  );
}

/* ─── MultiFilter (pokemon / move / ability / item) ─── */
function MultiFilter({ label, placeholder, options, ids, byId, onAdd, onRemove }: {
  label: string;
  placeholder: string;
  options: Array<{ id: number; name: string }>;
  ids: number[];
  byId: Map<number, { name: string }>;
  onAdd: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <div className="rail-block">
      <label className="rail-label">
        {label}{ids.length > 0 && <span className="rail-count">{ids.length}</span>}
      </label>
      <AutoComplete placeholder={placeholder} options={options} exclude={new Set(ids)} onPick={(id) => onAdd(id)} />
      {ids.length > 0 && (
        <div className="chip-row">
          {ids.map((id) => (
            <VChip key={id} label={byId.get(id)?.name || String(id)} onX={() => onRemove(id)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── ComboGroup (single pokemon's pinned conditions) ─── */
function ComboGroup({ pid, items, active, onEdit, onRemove }: {
  pid: number; items: Combo[]; active: boolean;
  onEdit: () => void; onRemove: (c: Combo) => void;
}) {
  const poke = LK.pokeById.get(pid);
  return (
    <div className={"cgroup" + (active ? " cgroup--active" : "")}>
      <button className="cgroup-head" onClick={onEdit}>
        <PokeToken pid={pid} size={32} />
        <strong>{poke ? poke.name : pid}</strong>
        <span className="cgroup-edit">{active ? "editing" : "edit"}</span>
      </button>
      <ul className="cgroup-list">
        {items.map((c, i) => (
          <li key={i}>
            <span className={"cgroup-kind cgroup-kind--" + c.kind}>
              {c.kind === "item" ? "@" : KIND_LABEL[c.kind]}
            </span>
            <span className="cgroup-val">{comboValName(c)}</span>
            <button onClick={(e) => { e.stopPropagation(); onRemove(c); }} aria-label="remove">✕</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ComboBuilder({ combos, draftPid, setDraftPid, addCombo, removeCombo }: {
  combos: Combo[];
  draftPid: number | null;
  setDraftPid: (pid: number | null) => void;
  addCombo: (c: Combo) => void;
  removeCombo: (c: Combo) => void;
}) {
  const [kind, setKind] = useState<Combo["kind"]>("move");
  const groups = useMemo(() => {
    const g: Record<number, Combo[]> = {};
    combos.forEach((c) => { (g[c.pid] = g[c.pid] || []).push(c); });
    return g;
  }, [combos]);

  const draftPoke = draftPid != null ? LK.pokeById.get(draftPid) : null;
  const valueOptions: Array<{ id: number; name: string }> = !draftPoke ? [] :
    kind === "move" ? LK.movesForPokemon(draftPid!) :
    kind === "ability" ? LK.abilitiesForPokemon(draftPid!) :
    kind === "item" ? LK.opts.items : LK.opts.natures;

  const usedVids = new Set(combos.filter((c) => c.pid === draftPid && c.kind === kind).map((c) => c.vid));

  return (
    <div className="combo">
      {Object.keys(groups).length > 0 && (
        <div className="combo-groups">
          {Object.keys(groups).map((pidStr) => (
            <ComboGroup key={pidStr} pid={+pidStr} items={groups[+pidStr]} active={+pidStr === draftPid}
              onEdit={() => setDraftPid(+pidStr)} onRemove={removeCombo} />
          ))}
        </div>
      )}

      {draftPoke ? (
        <div className="combo-draft">
          <div className="combo-draft-head">
            <PokeToken pid={draftPid!} size={35} />
            <strong>{draftPoke.name}</strong>
            <button className="combo-done" onMouseDown={(e) => { e.preventDefault(); setDraftPid(null); }}>done</button>
          </div>
          <div className="kind-seg">
            {(["move", "item", "ability", "nature"] as Combo["kind"][]).map((k) => (
              <button key={k} className={"kbtn" + (kind === k ? " kbtn--on" : "")}
                onMouseDown={(e) => { e.preventDefault(); setKind(k); }}>{k}</button>
            ))}
          </div>
          <AutoComplete small placeholder={`Add ${kind} for ${draftPoke.name}…`}
            options={valueOptions} exclude={usedVids}
            onPick={(vid) => addCombo({ pid: draftPid!, kind, vid })} />
        </div>
      ) : (
        <AutoComplete placeholder="Pin a Pokémon for exact conditions…"
          options={LK.opts.pokemons} onPick={(pid) => setDraftPid(pid)} />
      )}
    </div>
  );
}

/* ─── FormatPicker ─── */
function FormatPicker({ value, counts, onSet }: {
  value: number | null;
  counts: Record<number, number>;
  onSet: (id: number | null) => void;
}) {
  return (
    <div className="chip-wrap">
      {GAMEDATA.formats.map((f) => {
        const on = value === f.id;
        return (
          <button key={f.id} className={"fchip" + (on ? " fchip--on" : "")}
            style={{ "--th": TIER_HUE[f.tier] || "#64748b" } as React.CSSProperties}
            onClick={() => onSet(on ? null : f.id)}>
            {f.name}<span className="fchip-n">{counts[f.id] || 0}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── FilterRail ─── */
function FilterRail({ s, set, counts, addToList, removeFromList, combo, loggedIn, activeCount, onClear }: {
  s: FilterState;
  set: (patch: Partial<FilterState>) => void;
  counts: Record<number, number>;
  addToList: (key: keyof Pick<FilterState, "pokemon" | "move" | "ability" | "item">, id: number) => void;
  removeFromList: (key: keyof Pick<FilterState, "pokemon" | "move" | "ability" | "item">, id: number) => void;
  combo: { draftPid: number | null; setDraftPid: (pid: number | null) => void; addCombo: (c: Combo) => void; removeCombo: (c: Combo) => void };
  loggedIn: boolean;
  activeCount: number;
  onClear: () => void;
}) {
  return (
    <div className="rail-inner">
      <div className="rail-block">
        <label className="rail-label">Team name</label>
        <input className="text-input" placeholder="Search by name…" value={s.name}
          onChange={(e) => set({ name: e.target.value })} />
      </div>

      <div className="rail-block">
        <div className="rail-label-row">
          <label className="rail-label">Format</label>
          {s.format != null && <button className="mini-clear" onClick={() => set({ format: null })}>clear</button>}
        </div>
        <FormatPicker value={s.format} counts={counts} onSet={(id) => set({ format: id })} />
      </div>

      <div className="rail-section">
        <span className="rail-section-t">Contains</span>
        <span className="rail-section-s">team must include all of these</span>
      </div>

      <MultiFilter label="Pokémon" placeholder="Add a Pokémon…" options={LK.opts.pokemons}
        byId={LK.pokeById as Map<number, { name: string }>}
        ids={s.pokemon} onAdd={(id) => addToList("pokemon", id)} onRemove={(id) => removeFromList("pokemon", id)} />
      <MultiFilter label="Move" placeholder="Add a move…" options={LK.opts.moves}
        byId={LK.moveById as Map<number, { name: string }>}
        ids={s.move} onAdd={(id) => addToList("move", id)} onRemove={(id) => removeFromList("move", id)} />
      <MultiFilter label="Ability" placeholder="Add an ability…" options={LK.opts.abilities}
        byId={LK.abilById as Map<number, { name: string }>}
        ids={s.ability} onAdd={(id) => addToList("ability", id)} onRemove={(id) => removeFromList("ability", id)} />
      <MultiFilter label="Item" placeholder="Add an item…" options={LK.opts.items}
        byId={LK.itemById as Map<number, { name: string }>}
        ids={s.item} onAdd={(id) => addToList("item", id)} onRemove={(id) => removeFromList("item", id)} />

      <div className="rail-section">
        <span className="rail-section-t">Specific sets</span>
        <span className="rail-section-s">pin a Pokémon to an exact move, item, ability or nature</span>
      </div>
      <ComboBuilder combos={s.combos} {...combo} />

      {loggedIn && (
        <div className="rail-block">
          <label className="checkrow">
            <input type="checkbox" checked={s.likedBy} onChange={(e) => set({ likedBy: e.target.checked })} />
            <span>Liked by me</span>
          </label>
        </div>
      )}

      {activeCount > 0 && (
        <button className="clear-all" onClick={onClear}>Clear all filters ({activeCount})</button>
      )}
    </div>
  );
}

/* ─── Active filter pills ─── */
function Pill({ label, tone, onX }: { label: string; tone?: string; onX: () => void }) {
  return (
    <span className={"apill" + (tone ? ` apill--${tone}` : "")}>
      {label}
      <button onClick={onX} aria-label="remove">✕</button>
    </span>
  );
}

function SummaryPills({ s, set, removeFromList, removeCombo }: {
  s: FilterState;
  set: (patch: Partial<FilterState>) => void;
  removeFromList: (key: keyof Pick<FilterState, "pokemon" | "move" | "ability" | "item">, id: number) => void;
  removeCombo: (c: Combo) => void;
}) {
  return (
    <div className="active-filters">
      {s.name && <Pill label={`name: "${s.name}"`} onX={() => set({ name: "" })} />}
      {s.format != null && <Pill label={fmtName(s.format)} tone="fmt" onX={() => set({ format: null })} />}
      {s.pokemon.map((id) => <Pill key={"p" + id} label={LK.pokeById.get(id)?.name || String(id)} onX={() => removeFromList("pokemon", id)} />)}
      {s.move.map((id) => <Pill key={"m" + id} label={"move: " + (LK.moveById.get(id)?.name || id)} onX={() => removeFromList("move", id)} />)}
      {s.ability.map((id) => <Pill key={"a" + id} label={"ability: " + (LK.abilById.get(id)?.name || id)} onX={() => removeFromList("ability", id)} />)}
      {s.item.map((id) => <Pill key={"i" + id} label={"item: " + (LK.itemById.get(id)?.name || id)} onX={() => removeFromList("item", id)} />)}
      {s.combos.map((c, i) => (
        <Pill key={"c" + i} tone="combo"
          label={`${LK.pokeById.get(c.pid)?.name || c.pid} · ${c.kind === "item" ? "@ " : ""}${comboValName(c)}`}
          onX={() => removeCombo(c)} />
      ))}
      {s.likedBy && <Pill label="liked by me" onX={() => set({ likedBy: false })} />}
    </div>
  );
}

/* ─── Main component ─── */
export default function TeamBrowser() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    try {
      const saved = localStorage.getItem("pb-theme");
      if (saved === "light" || saved === "dark") return saved;
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } catch { return "light"; }
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("theme-switching");
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem("pb-theme", theme); } catch { /* noop */ }
    const id = setTimeout(() => root.classList.remove("theme-switching"), 80);
    return () => clearTimeout(id);
  }, [theme]);

  const [teams, setTeams] = useState<BrowserTeam[]>(MOCK_TEAMS);
  const [s, setS] = useState<FilterState>(() => {
    if (typeof window === "undefined") return EMPTY;
    return { ...EMPTY, ...LK.decode(window.location.search) };
  });
  const [draftPid, setDraftPid] = useState<number | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = (patch: Partial<FilterState>) => setS((p) => ({ ...p, ...patch }));
  const loggedIn = true;

  const queryString = useMemo(() => LK.encode(s), [s]);
  useEffect(() => {
    try {
      const url = window.location.pathname + (queryString ? "?" + queryString : "");
      window.history.replaceState(null, "", url);
    } catch { /* sandboxed */ }
  }, [queryString]);

  const counts = useMemo(() => {
    const c: Record<number, number> = {};
    teams.forEach((tm) => { c[tm.format] = (c[tm.format] || 0) + 1; });
    return c;
  }, [teams]);

  const filtered = useMemo(() => {
    let r = teams.filter((tm) => {
      if (s.name && !tm.name.toLowerCase().includes(s.name.toLowerCase())) return false;
      if (s.format != null && tm.format !== s.format) return false;
      if (s.likedBy && !tm.liked) return false;
      for (const pid of s.pokemon) if (!tm.members.some((m) => m.pid === pid)) return false;
      for (const mid of s.move) if (!tm.members.some((m) => m.moveIds.includes(mid))) return false;
      for (const aid of s.ability) if (!tm.members.some((m) => m.abilId === aid)) return false;
      for (const iid of s.item) if (!tm.members.some((m) => m.itemId === iid)) return false;
      for (const c of s.combos) {
        const ok = tm.members.some((m) => {
          if (m.pid !== c.pid) return false;
          if (c.kind === "move") return m.moveIds.includes(c.vid);
          if (c.kind === "item") return m.itemId === c.vid;
          if (c.kind === "ability") return m.abilId === c.vid;
          if (c.kind === "nature") return m.natId === c.vid;
          return false;
        });
        if (!ok) return false;
      }
      return true;
    });
    r = [...r].sort((a, b) =>
      s.sort === "popular" ? b.likes - a.likes :
      s.sort === "oldest" ? a.createdAt.localeCompare(b.createdAt) :
      b.createdAt.localeCompare(a.createdAt));
    return r;
  }, [teams, s]);

  const activeCount =
    (s.name ? 1 : 0) + (s.format != null ? 1 : 0) +
    s.pokemon.length + s.move.length + s.ability.length + s.item.length +
    s.combos.length + (s.likedBy ? 1 : 0);

  const addToList = (key: keyof Pick<FilterState, "pokemon" | "move" | "ability" | "item">, id: number) =>
    set({ [key]: [...s[key], id] });
  const removeFromList = (key: keyof Pick<FilterState, "pokemon" | "move" | "ability" | "item">, id: number) =>
    set({ [key]: s[key].filter((x) => x !== id) });
  const addCombo = (c: Combo) => {
    if (!s.combos.some((x) => x.pid === c.pid && x.kind === c.kind && x.vid === c.vid))
      set({ combos: [...s.combos, c] });
  };
  const removeCombo = (c: Combo) =>
    set({ combos: s.combos.filter((x) => !(x.pid === c.pid && x.kind === c.kind && x.vid === c.vid)) });
  const onClear = () => { setS({ ...EMPTY, sort: s.sort }); setDraftPid(null); };
  const onLike = (id: number) =>
    setTeams((ts) => ts.map((tm) =>
      tm.id === id ? { ...tm, liked: !tm.liked, likes: tm.likes + (tm.liked ? -1 : 1) } : tm));

  const copyLink = () => {
    const link = queryString ? `${window.location.pathname}?${queryString}` : window.location.href;
    try { navigator.clipboard.writeText(link); } catch { /* noop */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const combo = { draftPid, setDraftPid, addCombo, removeCombo };
  const rail = (
    <FilterRail s={s} set={set} counts={counts} addToList={addToList} removeFromList={removeFromList}
      combo={combo} loggedIn={loggedIn} activeCount={activeCount} onClear={onClear} />
  );

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">▲</span>
          <span className="brand-name">PokéBuild</span>
          <span className="brand-sub mono">GEN 4 · DPP</span>
        </div>
        <nav className="topnav">
          <a className="nav-link nav-link--active" href="#">Teams</a>
          <a className="nav-link" href="#">Pokédex</a>
          <a className="nav-link" href="#">Builder</a>
        </nav>
        <div className="topbar-right">
          <button className="theme-btn"
            onClick={() => setTheme((p) => (p === "dark" ? "light" : "dark"))}
            aria-label="Toggle light or dark theme">
            {theme === "dark" ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4.2" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5z" />
              </svg>
            )}
          </button>
          <button className="btn-primary">+ New team</button>
          <span className="me-avatar" style={{ background: avatarColor("azureblade") }} title="azureblade">A</span>
        </div>
      </header>

      <div className="layout">
        <aside className="rail">{rail}</aside>

        <main className="content">
          <div className="content-head">
            <div className="result-meta">
              <h1>Community teams</h1>
              <span className="result-count mono">
                {filtered.length} {filtered.length === 1 ? "team" : "teams"}
              </span>
            </div>
            <div className="content-tools">
              <button className="filters-btn" onClick={() => setDrawer(true)}>
                Filters{activeCount > 0 && <span className="filters-n">{activeCount}</span>}
              </button>
              <button className={"link-btn" + (copied ? " link-btn--ok" : "")} onClick={copyLink}>
                {copied ? "Link copied" : "Copy link"}
              </button>
              <div className="sort">
                <label className="mono">SORT</label>
                <select value={s.sort} onChange={(e) => set({ sort: e.target.value as FilterState["sort"] })}>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="popular">Most liked</option>
                </select>
              </div>
            </div>
          </div>

          {activeCount > 0 && (
            <SummaryPills s={s} set={set} removeFromList={removeFromList} removeCombo={removeCombo} />
          )}

          {filtered.length === 0 ? (
            <div className="empty">
              <p>No teams match every active filter.</p>
              <p className="empty-sub">All filters combine with AND — try removing one.</p>
              <button className="btn-primary" onClick={onClear}>Clear filters</button>
            </div>
          ) : (
            <div className="team-list">
              {filtered.map((team) => <TeamCard key={team.id} team={team} onLike={onLike} />)}
            </div>
          )}
        </main>
      </div>

      {drawer && (
        <div className="drawer-scrim" onClick={() => setDrawer(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <strong>Filters</strong>
              <button className="drawer-x" onClick={() => setDrawer(false)}>✕</button>
            </div>
            {rail}
          </div>
        </div>
      )}
    </div>
  );
}
