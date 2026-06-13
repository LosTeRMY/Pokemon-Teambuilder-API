"use client";

import { useState, useMemo } from "react";
import type { Combo, ComboKind } from "@/lib/lookups";
import * as LK from "@/lib/lookups";
import type { Named, ComboHandlers } from "@/lib/browserUtils";
import AutoComplete from "@/components/ui/AutoComplete";
import ComboGroup from "./ComboGroup";
import { cn } from "@/lib/cn";
import { PokeToken } from "@/components/ui/PokeToken";

export default function ComboBuilder({
  combos,
  draftPid,
  setDraftPid,
  addCombo,
  removeCombo,
}: ComboHandlers & { combos: Combo[] }) {
  const [kind, setKind] = useState<ComboKind>("move");

  const groups = useMemo(() => {
    const g: Record<number, Combo[]> = {};
    combos.forEach((c) => {
      (g[c.pid] = g[c.pid] || []).push(c);
    });
    return g;
  }, [combos]);

  const draftPoke = draftPid != null ? LK.pokeById.get(draftPid) : null;

  const valueOptions: Named[] =
    !draftPoke || draftPid == null
      ? []
      : kind === "move"
        ? LK.movesForPokemon(draftPid)
        : kind === "ability"
          ? LK.abilitiesForPokemon(draftPid)
          : kind === "item"
            ? LK.opts.items
            : LK.opts.natures;

  const usedVids = new Set(
    combos
      .filter((c) => c.pid === draftPid && c.kind === kind)
      .map((c) => c.vid),
  );

  return (
    <div className="flex flex-col gap-[9px]">
      {Object.keys(groups).length > 0 && (
        <div className="flex flex-col gap-[7px]">
          {Object.keys(groups).map((pidStr) => (
            <ComboGroup
              key={pidStr}
              pid={+pidStr}
              items={groups[+pidStr]}
              active={+pidStr === draftPid}
              onEdit={() => setDraftPid(+pidStr)}
              onRemove={removeCombo}
            />
          ))}
        </div>
      )}

      {draftPoke && draftPid != null ? (
        <div className="border border-dashed border-accent rounded-[10px] p-[9px] bg-accent-soft flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[13px]">
            <PokeToken pid={draftPid} size={28} />
            <strong className="flex-1">{draftPoke.name}</strong>
            <button
              className="bg-accent text-white border-none rounded-[7px] px-[10px] py-1 text-[11.5px] font-bold"
              onMouseDown={(e) => {
                e.preventDefault();
                setDraftPid(null);
              }}
            >
              done
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1 bg-surface border border-line rounded-[8px] p-[3px]">
            {(["move", "item", "ability", "nature"] as ComboKind[]).map((k) => (
              <button
                key={k}
                className={cn(
                  "bg-transparent border-none rounded-[6px] px-[2px] py-[5px] text-[11px] font-bold text-muted capitalize",
                  kind === k && "bg-accent text-white",
                )}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setKind(k);
                }}
              >
                {k}
              </button>
            ))}
          </div>
          <AutoComplete
            small
            placeholder={"Add " + kind + " for " + draftPoke.name + "…"}
            options={valueOptions}
            exclude={usedVids}
            onPick={(vid) => addCombo({ pid: draftPid, kind, vid })}
          />
        </div>
      ) : (
        <AutoComplete
          placeholder="Pin a Pokémon for exact conditions…"
          options={LK.opts.pokemons}
          onPick={(pid) => setDraftPid(pid)}
        />
      )}
    </div>
  );
}
