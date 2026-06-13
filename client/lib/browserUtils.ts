import * as LK from "@/lib/lookups";
import type { Combo, ComboKind } from "@/lib/lookups";
import { TYPE_COLORS } from "@/lib/mockData";

export type Named = { id: number; name: string };

export type ComboHandlers = {
  draftPid: number | null;
  setDraftPid: (pid: number | null) => void;
  addCombo: (c: Combo) => void;
  removeCombo: (c: Combo) => void;
};

export const TIER_HUE: Record<string, string> = {
  ubers: "#7a3fd0",
  ou: "#2f6fe0",
  uu: "#2f9a55",
  nu: "#d07f2a",
  pu: "#64748b",
  lc: "#2a9aa0",
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
