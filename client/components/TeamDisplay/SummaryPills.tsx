"use client";

import * as LK from "@/lib/lookups";
import type { Combo, FilterState } from "@/lib/lookups";
import { fmtName, comboValName } from "@/lib/browserUtils";
import Chip from "@/components/ui/Chip";

export default function SummaryPills({
  s,
  set,
  removeFromList,
  removeCombo,
}: {
  s: FilterState;
  set: (patch: Partial<FilterState>) => void;
  removeFromList: (key: "pokemon" | "move" | "ability" | "item", id: number) => void;
  removeCombo: (c: Combo) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.75 mb-4">
      {s.name && (
        <Chip variant="pill" label={`name: "${s.name}"`} onX={() => set({ name: "" })} />
      )}
      {s.format != null && (
        <Chip variant="pill" label={fmtName(s.format)} tone="fmt" onX={() => set({ format: null })} />
      )}
      {s.pokemon.map((id) => (
        <Chip variant="pill"
          key={"p" + id}
          label={LK.pokeById.get(id)?.name || String(id)}
          onX={() => removeFromList("pokemon", id)}
        />
      ))}
      {s.move.map((id) => (
        <Chip variant="pill"
          key={"m" + id}
          label={"move: " + (LK.moveById.get(id)?.name || id)}
          onX={() => removeFromList("move", id)}
        />
      ))}
      {s.ability.map((id) => (
        <Chip variant="pill"
          key={"a" + id}
          label={"ability: " + (LK.abilById.get(id)?.name || id)}
          onX={() => removeFromList("ability", id)}
        />
      ))}
      {s.item.map((id) => (
        <Chip variant="pill"
          key={"i" + id}
          label={"item: " + (LK.itemById.get(id)?.name || id)}
          onX={() => removeFromList("item", id)}
        />
      ))}
      {s.combos.map((c, i) => (
        <Chip variant="pill"
          key={"c" + i}
          tone="combo"
          label={`${LK.pokeById.get(c.pid)?.name || c.pid} · ${c.kind === "item" ? "@ " : ""}${comboValName(c)}`}
          onX={() => removeCombo(c)}
        />
      ))}
      {s.likedBy && (
        <Chip variant="pill" label="liked by me" onX={() => set({ likedBy: false })} />
      )}
    </div>
  );
}
