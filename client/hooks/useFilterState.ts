import { useState, useEffect } from "react";
import * as LK from "@/lib/lookups";
import type { Combo, FilterState } from "@/lib/lookups";
import type { ComboHandlers } from "@/lib/browserUtils";

const EMPTY: FilterState = {
  name: "",
  format: null,
  pokemon: [],
  move: [],
  ability: [],
  item: [],
  combos: [],
  likedBy: false,
  sort: "newest",
  page: 1,
};

export type FilterListKey = "pokemon" | "move" | "ability" | "item";

export type FilterControls = {
  s: FilterState;
  set: (patch: Partial<FilterState>) => void;
  addToList: (key: FilterListKey, id: number) => void;
  removeFromList: (key: FilterListKey, id: number) => void;
  removeCombo: (c: Combo) => void;
  combo: ComboHandlers;
  activeCount: number;
  onClear: () => void;
};

export function useFilterState(): FilterControls {
  const [s, setS] = useState<FilterState>(EMPTY);
  const [draftPid, setDraftPid] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setS((p) => ({ ...p, ...LK.decode(window.location.search) }));
  }, []);

  // Any filter mutation resets to page 1 (unless the patch itself sets page,
  // which only the pager does) — otherwise narrowing the result set while on
  // page 3+ can land on an out-of-range/empty page.
  const set = (patch: Partial<FilterState>) =>
    setS((p) => ({ ...p, ...patch, page: patch.page ?? 1 }));

  const addToList = (key: FilterListKey, id: number) =>
    setS((p) => ({ ...p, [key]: [...p[key], id], page: 1 }));

  const removeFromList = (key: FilterListKey, id: number) =>
    setS((p) => ({ ...p, [key]: p[key].filter((x) => x !== id), page: 1 }));

  const addCombo = (c: Combo) =>
    setS((p) => {
      if (p.combos.some((x) => x.pid === c.pid && x.kind === c.kind && x.vid === c.vid))
        return p;
      return { ...p, combos: [...p.combos, c], page: 1 };
    });

  const removeCombo = (c: Combo) =>
    setS((p) => ({
      ...p,
      combos: p.combos.filter(
        (x) => !(x.pid === c.pid && x.kind === c.kind && x.vid === c.vid),
      ),
      page: 1,
    }));

  const onClear = () => {
    setS((p) => ({ ...EMPTY, sort: p.sort }));
    setDraftPid(null);
  };

  const activeCount =
    (s.name ? 1 : 0) +
    (s.format != null ? 1 : 0) +
    s.pokemon.length +
    s.move.length +
    s.ability.length +
    s.item.length +
    s.combos.length +
    (s.likedBy ? 1 : 0);

  const combo: ComboHandlers = { draftPid, setDraftPid, addCombo, removeCombo };

  return { s, set, addToList, removeFromList, removeCombo, combo, activeCount, onClear };
}
