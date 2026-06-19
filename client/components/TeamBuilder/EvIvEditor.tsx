"use client";

import { useState } from "react";
import * as LK from "@/lib/lookups";
import {
  STAT_ORDER, STAT_LABEL, EV_BUDGET, EV_MAX, IV_MAX,
  calcStat,
  type StatSpread, type StatKey,
} from "@/lib/teamBuilder";
import { cn } from "@/lib/cn";

const STAT_COLOR: Record<StatKey, string> = {
  hp: "#df5a52", atk: "#e8843c", def: "#e6bd3a", spa: "#4b8de8", spd: "#4cae6a", spe: "#e07da4",
};

export default function EvIvEditor({
  base,
  evs,
  ivs,
  natureId,
  level,
  onEv,
  onIv,
  onResetEvs,
}: {
  base: StatSpread;
  evs: StatSpread;
  ivs: StatSpread;
  natureId: number | null;
  level: number;
  onEv: (stat: StatKey, value: number) => void;
  onIv: (stat: StatKey, value: number) => void;
  onResetEvs: () => void;
}) {
  const [showIv, setShowIv] = useState(false);
  const nature = natureId != null ? LK.natById.get(natureId) : null;
  const total = STAT_ORDER.reduce((s, k) => s + (evs[k] || 0), 0);
  const remaining = EV_BUDGET - total;
  const over = remaining < 0;

  const setEv = (k: StatKey, raw: string) => onEv(k, Math.max(0, Math.min(EV_MAX, parseInt(raw, 10) || 0)));
  const setIv = (k: StatKey, raw: string) => onIv(k, Math.max(0, Math.min(IV_MAX, parseInt(raw, 10) || 0)));

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[11px] font-extrabold tracking-[0.07em] uppercase text-faint flex items-center justify-between">
        EV spread <em className="font-semibold not-italic normal-case tracking-normal text-muted text-[11.5px]">at Lv 100</em>
      </span>
      <div className="flex items-center justify-between text-[11.5px]">
        <span>Spent <b className="font-mono font-bold">{total}</b> / {EV_BUDGET}</span>
        <span>
          {over ? (
            <b className="font-mono font-bold text-like-fg">over by {-remaining}</b>
          ) : (
            <span className="text-[#2f9a5a]">{remaining} EVs left</span>
          )}
          {" · "}
          <button type="button" className="bg-transparent border-0 text-accent text-[11px] font-bold p-0" onClick={onResetEvs}>reset</button>
        </span>
      </div>
      <div className="flex flex-col gap-1.75">
        {STAT_ORDER.map((stat) => {
          const ev = evs[stat] || 0;
          const iv = ivs[stat] == null ? IV_MAX : ivs[stat];
          const final = calcStat(stat, base[stat], iv, ev, natureId, level);
          const up = nature?.boostedStat === stat;
          const down = nature?.reducedStat === stat;
          return (
            <div key={stat} className="grid grid-cols-[34px_38px_1fr_52px_48px] items-center gap-2.5">
              <span className={cn("text-[12px] font-extrabold", up ? "text-[#2f9a5a]" : down ? "text-like-fg" : "text-ink")}>
                {STAT_LABEL[stat]}{up ? "▲" : down ? "▼" : ""}
              </span>
              <span className="font-mono text-[11px] text-faint text-right">{base[stat]}</span>
              <input
                type="range" min={0} max={EV_MAX} step={4} value={ev}
                style={{ accentColor: STAT_COLOR[stat] }}
                className="tb-ev-range"
                onChange={(e) => setEv(stat, e.target.value)}
                aria-label={`${STAT_LABEL[stat]} EVs`}
              />
              <input
                type="number" min={0} max={EV_MAX} value={ev}
                className="w-13 font-mono text-[12.5px] font-semibold text-center text-ink bg-input-bg border border-line rounded-[7px] px-1 py-1.25 focus:outline-none focus:border-accent"
                onChange={(e) => setEv(stat, e.target.value)}
              />
              <span className="font-mono text-[13px] font-bold text-ink text-right">{final}</span>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        className="bg-transparent border-0 text-accent text-[12px] font-bold p-0 inline-flex items-center gap-1.25 mt-1 self-start"
        onClick={() => setShowIv((s) => !s)}
      >
        <svg
          viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          className={cn("transition-transform duration-150", showIv && "rotate-90")}
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
        IVs {showIv ? "" : `(all ${IV_MAX})`}
      </button>
      {showIv && (
        <div className="grid grid-cols-3 gap-2">
          {STAT_ORDER.map((stat) => (
            <label key={stat} className="flex flex-col gap-1">
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-faint">{STAT_LABEL[stat]}</span>
              <input
                type="number" min={0} max={IV_MAX} value={ivs[stat] == null ? IV_MAX : ivs[stat]}
                className="font-mono text-[13px] text-center text-ink bg-input-bg border border-line rounded-[7px] px-1.5 py-1.5 focus:outline-none focus:border-accent"
                onChange={(e) => setIv(stat, e.target.value)}
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
