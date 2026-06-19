"use client";

import * as LK from "@/lib/lookups";
import { GAMEDATA } from "@/lib/gameData";
import { STAT_LABEL, type StatKey } from "@/lib/teamBuilder";

export default function NaturePicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const nature = value != null ? LK.natById.get(value) : null;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-extrabold tracking-[0.07em] uppercase text-faint">Nature</span>
      <div className="flex items-center gap-2.5 flex-wrap">
        <select
          className="font-bold text-[14px] text-ink bg-input-bg border border-line rounded-[9px] px-3 py-2.25 min-w-37.5 focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        >
          {GAMEDATA.natures.map((n) => {
            const tag = n.boostedStat
              ? ` (+${STAT_LABEL[n.boostedStat as StatKey]} / -${STAT_LABEL[n.reducedStat as StatKey]})`
              : " (neutral)";
            return <option key={n.id} value={n.id}>{n.name + tag}</option>;
          })}
        </select>
        <span className="flex gap-2 text-[12px] font-bold">
          {nature?.boostedStat ? (
            <>
              <span className="text-[#2f9a5a]">+10% {STAT_LABEL[nature.boostedStat as StatKey]}</span>
              <span className="text-like-fg">−10% {STAT_LABEL[nature.reducedStat as StatKey]}</span>
            </>
          ) : (
            <span className="text-faint font-semibold">No stat change</span>
          )}
        </span>
      </div>
    </div>
  );
}
