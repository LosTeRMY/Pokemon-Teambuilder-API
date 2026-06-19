"use client";

import { useState } from "react";
import type { BrowserMember } from "@/lib/lookups";
import { SpriteTile } from "@/components/ui/PokeToken";
import { tc } from "@/lib/browserUtils";

export default function MonSlot({ mon, size }: { mon: BrowserMember; size: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="mon relative flex flex-col items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen((o) => !o)}
    >
      <div
        className="mon-frame bg-tile border border-line border-b-[3px] rounded-[11px] p-0.5 grid place-items-center transition-[transform,box-shadow,border-color] duration-120"
        style={{ borderBottomColor: tc(mon.t[0]) }}
      >
        <SpriteTile slug={mon.s} name={mon.n} types={mon.t} size={size} />
      </div>
      {open && (
        <div className="mon-pop">
          <div className="mon-pop-head">
            <strong>{mon.n}</strong>
            <span className="mon-pop-types">
              {mon.t.map((t) => (
                <em key={t} style={{ background: tc(t) }}>
                  {t}
                </em>
              ))}
            </span>
          </div>
          <div className="mon-pop-meta">
            <span>@ {mon.item}</span>
            <span>{mon.abil}</span>
            <span>{mon.nat}</span>
          </div>
          <ul className="mon-pop-moves">
            {mon.moves.map((mv) => (
              <li key={mv}>{mv}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
