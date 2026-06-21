import * as LK from "@/lib/lookups";
import type { Combo, ComboKind } from "@/lib/lookups";

export const TIER_HUE: Record<string, string> = {
  ubers: "#7a3fd0",
  ou:    "#2f6fe0",
  uu:    "#2f9a55",
  nu:    "#d07f2a",
  pu:    "#8e6bbf",
  lc:    "#2a9dbf",
};

export const TIER_LABEL: Record<string, string> = {
  ubers: "Uber", ou: "OU", uu: "UU", nu: "NU", pu: "PU", lc: "LC",
};

const TYPE_COLORS: Record<string, string> = {
  normal: "#9b9a6e", fire: "#e8702a", water: "#4b7bd8", electric: "#e8c020",
  grass: "#5aa83e", ice: "#5cc0c0", fighting: "#c0392b", poison: "#9b3f9b",
  ground: "#cba84a", flying: "#8a7be0", psychic: "#e84d7a", bug: "#8a9a18",
  rock: "#a08a2e", ghost: "#5e4a86", dragon: "#5a2fd8", dark: "#5a4a3f",
  steel: "#8a8aa8",
};

export type Named = { id: number; name: string };

export type ComboHandlers = {
  draftPid: number | null;
  setDraftPid: (pid: number | null) => void;
  addCombo: (c: Combo) => void;
  removeCombo: (c: Combo) => void;
};

export const tc = (t: string) => TYPE_COLORS[t] || "#888";
export const fmtName = (id: number) => LK.fmtById.get(id)?.name || String(id);
export const fmtTier = (id: number) => LK.fmtById.get(id)?.tier || "pu";
export const tierHue = (id: number) => TIER_HUE[fmtTier(id)] || "#64748b";

export const KIND_LABEL: Record<ComboKind, string> = {
  move: "move",
  item: "item",
  ability: "ability",
  nature: "nature",
};

export const comboValName = (c: Combo): string => {
  const map: Record<ComboKind, Map<number, Named>> = {
    move: LK.moveById,
    item: LK.itemById,
    ability: LK.abilById,
    nature: LK.natById,
  };
  return map[c.kind].get(c.vid)?.name || String(c.vid);
};

export const relDate = (iso: string): string => {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(iso + "T00:00:00") : new Date(iso);
  const days = Math.round((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  if (days < 30) return days + "d ago";
  if (days < 60) return "1mo ago";
  return Math.floor(days / 30) + "mo ago";
};

export function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `oklch(0.7 0.11 ${h})`;
}

const MEMBER_SINCE_FMT = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });
export const memberSince = (iso: string): string => MEMBER_SINCE_FMT.format(new Date(iso));
