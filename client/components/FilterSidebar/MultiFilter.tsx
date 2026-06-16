"use client";

import { useMemo } from "react";
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
  const excludeSet = useMemo(() => new Set(ids), [ids]);
  return (
    <div className="flex flex-col gap-2">
      <Label>
        {label}
        {ids.length > 0 && (
          <span className="ml-1.5 font-mono tabular-nums text-[10px] font-bold bg-accent text-white rounded-[20px] px-1.5 py-px align-middle">
            {ids.length}
          </span>
        )}
      </Label>
      <AutoComplete
        placeholder={placeholder}
        options={options}
        exclude={excludeSet}
        onPick={(id) => onAdd(id)}
      />
      {ids.length > 0 && (
        <div className="flex flex-wrap gap-1.25 mt-1.75">
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
