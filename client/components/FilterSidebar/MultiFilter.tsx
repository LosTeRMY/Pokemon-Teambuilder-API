"use client";

import type { Named } from "@/lib/browserUtils";
import AutoComplete from "@/components/ui/AutoComplete";
import Chip from "@/components/ui/Chip";
import Label from "@/components/ui/Label";

export default function MultiFilter({
  label,
  placeholder,
  options,
  ids,
  byId,
  onAdd,
  onRemove,
}: {
  label: string;
  placeholder: string;
  options: Named[];
  ids: number[];
  byId: Map<number, Named>;
  onAdd: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>
        {label}
        {ids.length > 0 && (
          <span className="ml-[6px] font-mono tabular-nums text-[10px] font-bold bg-accent text-white rounded-[20px] px-[6px] py-px align-middle">
            {ids.length}
          </span>
        )}
      </Label>
      <AutoComplete
        placeholder={placeholder}
        options={options}
        exclude={new Set(ids)}
        onPick={(id) => onAdd(id)}
      />
      {ids.length > 0 && (
        <div className="flex flex-wrap gap-[5px] mt-[7px]">
          {ids.map((id) => (
            <Chip
              key={id}
              label={byId.get(id)?.name || String(id)}
              onX={() => onRemove(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
