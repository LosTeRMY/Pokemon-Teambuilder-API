"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type { Named } from "@/lib/browserUtils";
import { cn } from "@/lib/cn";
import Input from "./Input";

export default function AutoComplete({
  placeholder,
  options,
  onPick,
  exclude,
  small,
}: {
  placeholder: string;
  options: Named[];
  onPick: (id: number, name: string) => void;
  exclude?: Set<number>;
  small?: boolean;
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current); };
  }, []);

  const matches = useMemo(() => {
    const ex = exclude || new Set<number>();
    const s = q.trim().toLowerCase();
    let list = options.filter((o) => !ex.has(o.id));
    if (s) {
      list = list
        .filter((o) => o.name.toLowerCase().includes(s))
        .sort((a, b) => {
          const ai = a.name.toLowerCase().startsWith(s) ? 0 : 1;
          const bi = b.name.toLowerCase().startsWith(s) ? 0 : 1;
          return ai - bi || a.name.localeCompare(b.name);
        });
    }
    return list.slice(0, 8);
  }, [q, options, exclude]);

  const pick = (o?: Named) => {
    if (!o) return;
    onPick(o.id, o.name);
    setQ("");
    setOpen(false);
    setHi(0);
  };

  return (
    <div className="relative">
      <Input
        small={small}
        placeholder={placeholder}
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setHi(0);
        }}
        onFocus={() => {
          if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
          setOpen(true);
        }}
        onBlur={() => {
          blurTimeoutRef.current = setTimeout(() => setOpen(false), 130);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHi((h) => Math.min(h + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHi((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            pick(matches[hi]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && matches.length > 0 && (
        <ul className="absolute top-[calc(100%+4px)] left-0 right-0 z-40 list-none m-0 p-1 bg-surface border border-line rounded-[9px] shadow-[0_14px_32px_-10px_var(--shadow-pop)] max-h-[260px] overflow-y-auto">
          {matches.map((o, i) => (
            <li
              key={o.id}
              className={cn(
                "px-[9px] py-[7px] rounded-[6px] text-[13px] cursor-pointer text-ink whitespace-nowrap overflow-hidden text-ellipsis",
                i === hi && "bg-accent-soft text-accent",
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(o);
              }}
              onMouseEnter={() => setHi(i)}
            >
              <span>{o.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
