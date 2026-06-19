"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import * as LK from "@/lib/lookups";
import { avatarColor } from "@/lib/browserUtils";
import { cn } from "@/lib/cn";

function ItemFallback({ name, size = 26 }: { name: string; size?: number }) {
  return (
    <span
      className="rounded-[7px] grid place-items-center text-[11px] font-extrabold text-white shrink-0"
      style={{ width: size, height: size, background: avatarColor(name) }}
    >
      {name[0].toUpperCase()}
    </span>
  );
}

export default function ItemPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const item = value != null ? LK.itemById.get(value) : null;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return LK.opts.items;
    return LK.opts.items.filter((i) => i.name.toLowerCase().includes(s));
  }, [q]);

  const pick = (id: number) => { onChange(id); setOpen(false); setQ(""); };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-extrabold tracking-[0.07em] uppercase text-faint">Item</span>
      <div className="relative" ref={ref}>
        <div
          className={cn(
            "flex items-center gap-2.5 w-full bg-input-bg border rounded-[9px] px-3 py-2.25 transition-all duration-140",
            open ? "border-accent shadow-[0_0_0_3px_var(--accent-soft)] bg-surface" : "border-line hover:border-muted",
          )}
        >
          <button
            type="button"
            className="flex items-center gap-2.5 flex-1 min-w-0 text-left bg-transparent border-0 p-0"
            onClick={() => setOpen((o) => !o)}
          >
            {item ? <ItemFallback name={item.name} /> : <ItemFallback name=" " />}
            <span className="flex-1 min-w-0 flex flex-col gap-0.5">
              {item ? (
                <>
                  <span className="text-[14.5px] font-bold text-ink truncate">{item.name}</span>
                  <span className="text-[11.5px] text-muted leading-[1.35] line-clamp-2">{item.description}</span>
                </>
              ) : (
                <span className="text-faint font-medium text-[14px]">No item — click to choose</span>
              )}
            </span>
          </button>
          {item && (
            <button
              type="button"
              aria-label="Remove item"
              className="shrink-0 text-faint p-0.5 grid place-items-center rounded-[5px] bg-transparent border-0 hover:text-like-fg hover:bg-like-bg"
              onClick={() => onChange(null)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          )}
          <button
            type="button"
            aria-label={open ? "Close item picker" : "Open item picker"}
            className="shrink-0 bg-transparent border-0 p-0"
            onClick={() => setOpen((o) => !o)}
          >
            <svg
              viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              className={cn("text-faint transition-transform duration-150", open && "rotate-180")}
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
        {open && (
          <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-60 bg-surface border border-line rounded-[11px] shadow-[0_22px_50px_-16px_var(--shadow-pop)] overflow-hidden flex flex-col max-h-95 motion-safe:animate-[tbMenuIn_0.14s_ease]">
            <div className="p-2.25 border-b border-line sticky top-0 bg-surface">
              <input
                autoFocus
                value={q}
                placeholder="Search 200+ items…"
                onChange={(e) => setQ(e.target.value)}
                className="w-full border border-line bg-input-bg rounded-lg px-2.75 py-2 text-[13.5px] text-ink focus:outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)]"
              />
            </div>
            <div className="overflow-y-auto p-1.25">
              {filtered.length === 0 && (
                <div className="p-5.5 text-center text-[13px] text-faint">No items match &ldquo;{q}&rdquo;.</div>
              )}
              {filtered.slice(0, 80).map((i) => (
                <button
                  key={i.id}
                  type="button"
                  className={cn(
                    "grid grid-cols-[30px_1fr] items-center gap-2.5 w-full text-left rounded-lg px-3 py-1.75 hover:bg-accent-soft",
                    i.id === value && "bg-[color-mix(in_srgb,var(--accent)_12%,var(--surface))]",
                  )}
                  onClick={() => pick(i.id)}
                >
                  <ItemFallback name={i.name} size={24} />
                  <span className="flex flex-col gap-0.25 min-w-0">
                    <b className="text-[13.5px] font-bold truncate">{i.name}</b>
                    <small className="text-[11px] text-muted truncate">{i.description}</small>
                  </span>
                </button>
              ))}
            </div>
            <div className="flex justify-between px-3 py-1.75 border-t border-line text-[11px] text-faint bg-surface-2">
              <span>{filtered.length} items</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
