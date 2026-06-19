"use client";

import * as LK from "@/lib/lookups";
import { cn } from "@/lib/cn";

export default function AbilityPicker({
  pid,
  value,
  onChange,
}: {
  pid: number;
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const legalList = LK.abilitiesForPokemon(pid);
  const legal = legalList.length ? legalList : value != null ? [LK.abilById.get(value)].filter(Boolean) as { id: number; name: string; description: string }[] : [];
  const current = value != null ? LK.abilById.get(value) : null;
  const opts = current && !legal.some((a) => a.id === current.id) ? [current, ...legal] : legal;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-extrabold tracking-[0.07em] uppercase text-faint flex items-center justify-between">
        Ability <em className="font-semibold not-italic normal-case tracking-normal text-muted text-[11.5px]">{opts.length > 1 ? `${opts.length} possible` : "fixed"}</em>
      </span>
      <div className="inline-flex flex-wrap w-fit max-w-full bg-surface-2 border border-line rounded-lg p-0.75 gap-0.5">
        {opts.map((a) => (
          <button
            key={a.id}
            type="button"
            className={cn(
              "rounded-md px-2.75 py-1.25 text-[12.5px] font-bold",
              a.id === value ? "bg-accent text-white" : "text-muted hover:text-ink",
            )}
            onClick={() => onChange(a.id)}
          >
            {a.name}
          </button>
        ))}
      </div>
      {current && (
        <div className="text-[12.5px] text-muted leading-[1.45] px-3 py-2.5 bg-surface-2 border border-line-soft rounded-[9px]">
          <b className="text-ink">{current.name}.</b> {current.description}
        </div>
      )}
    </div>
  );
}
