"use client";

import { type CSSProperties } from "react";
import { GAMEDATA } from "@/lib/gameData";
import { TIER_HUE } from "@/lib/browserUtils";
import { cn } from "@/lib/cn";

export default function FormatPicker({
  value,
  counts,
  onSet,
}: {
  value: number | null;
  counts: Record<number, number>;
  onSet: (id: number | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.75">
      {GAMEDATA.formats.map((f) => {
        const on = value === f.id;
        return (
          <button
            key={f.id}
            className={cn("fchip", on && "fchip--on")}
            style={{ "--th": TIER_HUE[f.tier] || "#64748b" } as CSSProperties}
            onClick={() => onSet(on ? null : f.id)}
          >
            {f.name}
            <span className="fchip-n">{counts[f.id] || 0}</span>
          </button>
        );
      })}
    </div>
  );
}
