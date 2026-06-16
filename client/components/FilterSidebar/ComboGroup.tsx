"use client";

import type { Combo } from "@/lib/lookups";
import * as LK from "@/lib/lookups";
import { KIND_LABEL, comboValName } from "@/lib/browserUtils";
import { PokeToken } from "@/components/ui/PokeToken";
import { cn } from "@/lib/cn";

export default function ComboGroup({
  pid,
  items,
  active,
  onEdit,
  onRemove,
}: {
  pid: number;
  items: Combo[];
  active: boolean;
  onEdit: () => void;
  onRemove: (c: Combo) => void;
}) {
  const poke = LK.pokeById.get(pid);
  return (
    <div
      className={cn(
        "border border-line rounded-[10px] overflow-hidden bg-surface",
        active && "border-accent shadow-[0_0_0_3px_var(--accent-soft)]",
      )}
    >
      <button
        className="flex items-center gap-2 w-full px-2.25 py-1.75 bg-surface-2 border-none border-b border-line-soft text-[13px] font-bold text-ink cursor-pointer text-left"
        onClick={onEdit}
      >
        <PokeToken pid={pid} size={26} />
        <strong className="flex-1">{poke ? poke.name : pid}</strong>
        <span className="text-[10.5px] font-bold text-accent uppercase tracking-[0.04em]">
          {active ? "editing" : "edit"}
        </span>
      </button>
      <ul className="cgroup-list list-none m-0 px-2 pt-1.25 pb-1.75 flex flex-col gap-0.75">
        {items.map((c, i) => (
          <li key={i} className="flex items-center gap-1.75 text-[12.5px]">
            <span className={"cgroup-kind cgroup-kind--" + c.kind}>
              {c.kind === "item" ? "@" : KIND_LABEL[c.kind]}
            </span>
            <span className="flex-1 font-semibold">{comboValName(c)}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(c);
              }}
              aria-label="remove"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
