"use client";

import type { FilterControls } from "@/lib/useFilterState";
import * as LK from "@/lib/lookups";
import MultiFilter from "./MultiFilter";
import FormatPicker from "./FormatPicker";
import ComboBuilder from "./ComboBuilder";
import Input from "@/components/ui/Input";
import Label from "@/components/ui/Label";

export default function FilterRail({
  filter,
  counts,
  loggedIn,
}: {
  filter: FilterControls;
  counts: Record<number, number>;
  loggedIn: boolean;
}) {
  const { s, set, addToList, removeFromList, combo, activeCount, onClear } = filter;
  return (
    <div className="px-6 pt-6 pb-7 flex flex-col gap-[14px] justify-between min-h-full box-border">
      {/* Search by name */}
      <div className="flex flex-col gap-2">
        <Label>
          Team name
        </Label>
        <Input
          placeholder="Search by name…"
          value={s.name}
          onChange={(e) => set({ name: e.target.value })}
        />
      </div>
        {/* Search by format */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <Label>
            Format
          </Label>
          {s.format != null && (
            <button
              className="bg-transparent border-none text-accent text-[11.5px] font-semibold p-0"
              onClick={() => set({ format: null })}
            >
              clear
            </button>
          )}
        </div>
        <FormatPicker
          value={s.format}
          counts={counts}
          onSet={(id) => set({ format: id })}
        />
      </div>
        {/* Contains filters */}
      <div className="flex flex-col gap-[2px] pt-[10px] border-t border-line mt-[2px]">
        <span className="text-[13.5px] font-extrabold tracking-[-0.01em] text-ink">
          Contains
        </span>
        <span className="text-[11.5px] text-faint leading-[1.35]">
          team must include all of these
        </span>
      </div>
      <MultiFilter
        label="Pokémon"
        placeholder="Add a Pokémon…"
        options={LK.opts.pokemons}
        byId={LK.pokeById}
        ids={s.pokemon}
        onAdd={(id) => addToList("pokemon", id)}
        onRemove={(id) => removeFromList("pokemon", id)}
      />
      <MultiFilter
        label="Move"
        placeholder="Add a move…"
        options={LK.opts.moves}
        byId={LK.moveById}
        ids={s.move}
        onAdd={(id) => addToList("move", id)}
        onRemove={(id) => removeFromList("move", id)}
      />
      <MultiFilter
        label="Ability"
        placeholder="Add an ability…"
        options={LK.opts.abilities}
        byId={LK.abilById}
        ids={s.ability}
        onAdd={(id) => addToList("ability", id)}
        onRemove={(id) => removeFromList("ability", id)}
      />
      <MultiFilter
        label="Item"
        placeholder="Add an item…"
        options={LK.opts.items}
        byId={LK.itemById}
        ids={s.item}
        onAdd={(id) => addToList("item", id)}
        onRemove={(id) => removeFromList("item", id)}
      />
      {/* Search by specific set */}
      <div className="flex flex-col gap-[2px] pt-[10px] border-t border-line mt-[2px]">
        <span className="text-[13.5px] font-extrabold tracking-[-0.01em] text-ink">
          Specific sets
        </span>
        <span className="text-[11.5px] text-faint leading-[1.35]">
          pin a Pokémon to an exact move, item, ability or nature
        </span>
      </div>
      <ComboBuilder combos={s.combos} {...combo} />
      {/* Liked filter */}
      {loggedIn && (
        <div className="flex flex-col gap-2">
          <label className="checkrow flex items-center gap-2.5 text-[14px] font-semibold text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={s.likedBy}
              onChange={(e) => set({ likedBy: e.target.checked })}
            />
            <span>Liked by me</span>
          </label>
        </div>
      )}
      {/* Clear filters */}
      {activeCount > 0 && (
        <button
          className="bg-accent-soft text-accent border-none p-[9px] rounded-[8px] text-[12.5px] font-bold"
          onClick={onClear}
        >
          Clear all filters ({activeCount})
        </button>
      )}
    </div>
  );
}
