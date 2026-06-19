"use client";

import { useState, useRef, useEffect } from "react";
import { spriteUrl } from "@/lib/mockData";
import { tc } from "@/lib/browserUtils";
import { slug } from "@/lib/lookups";
import type { GBPokemon } from "@/lib/gameData";
import TypeBadge from "@/components/ui/TypeBadge";
import TierBadge, { TIER_HUE, TIER_LABEL } from "@/components/ui/TierBadge";

function bst(s: GBPokemon["baseStats"]) {
  return s.hp + s.atk + s.def + s.spa + s.spd + s.spe;
}

export default function Hero({
  mon,
  role,
  overview,
  usageRate,
  topItemName,
  topItemPct,
  setsCount,
}: {
  mon: GBPokemon;
  role: string;
  overview: string;
  usageRate: number;
  topItemName: string;
  topItemPct: number;
  setsCount: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  // t1/t2 tint the background gradient and sprite frame from the mon's own
  // types instead of a fixed accent color — single-type mons use t1 for both.
  const t1 = tc(mon.types[0]);
  const t2 = tc(mon.types[mon.types.length - 1]);
  const sp = slug(mon.name);
  const total = bst(mon.baseStats);
  const tierHue = TIER_HUE[mon.tier];
  const tierLabel = TIER_LABEL[mon.tier] ?? mon.tier.toUpperCase();

  return (
    <div
      className="grid grid-cols-[280px_minmax(0,1fr)_256px] border rounded-[22px] overflow-hidden max-[1240px]:grid-cols-[240px_minmax(0,1fr)] max-[820px]:grid-cols-1"
      style={{ borderColor: `color-mix(in srgb, ${t1} 18%, var(--line))` }}
    >
      {/* Art */}
      <div
        className="relative flex flex-col items-center justify-center gap-4 py-7.5 px-6 border-r border-line-soft max-[820px]:border-r-0 max-[820px]:border-b"
        style={{
          background: `linear-gradient(135deg, color-mix(in srgb, ${t1} 17%, var(--surface)) 0%, color-mix(in srgb, ${t2} 9%, var(--surface)) 46%, var(--surface) 78%)`,
        }}
      >
        <div
          className="relative grid place-items-center rounded-[22px] overflow-hidden"
          style={{
            width: 184,
            height: 184,
            background: `color-mix(in srgb, ${t1} 12%, var(--surface))`,
            boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${t1} 22%, var(--line))`,
          }}
        >
          {/* Type-colored placeholder shows immediately and fades out once the
              real sprite has loaded, so there's never a blank frame. */}
          <div
            className="absolute inset-0 grid place-items-center text-center text-white font-extrabold text-[18px] p-2 transition-opacity duration-250 [text-shadow:0_1px_3px_rgba(0,0,0,0.34)]"
            style={{
              background: `linear-gradient(135deg, ${t1}, ${t2})`,
              opacity: loaded ? 0 : 1,
            }}
          >
            {mon.name}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            className="w-37.5 h-37.5 object-contain transition-opacity duration-250 [image-rendering:-webkit-optimize-contrast] drop-shadow-[0_6px_12px_rgba(0,0,0,0.22)]"
            src={spriteUrl(sp)}
            alt={mon.name}
            onLoad={() => setLoaded(true)}
            style={{ opacity: loaded ? 1 : 0 }}
          />
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-col min-w-0 py-7.5 px-8">
        <div className="flex items-center gap-3 mb-2.75">
          <span className="text-[13.5px] font-bold text-faint font-mono">
            #{String(mon.dexNum ?? mon.id).padStart(3, "0")}
          </span>
          {tierHue && <TierBadge hue={tierHue}>{tierLabel} tier</TierBadge>}
          <span className="inline-flex items-center gap-1.5 ml-auto text-[12px] font-bold text-accent bg-accent-soft rounded-full px-3 py-1">
            <b className="font-mono">{usageRate.toFixed(1)}%</b> usage
          </span>
        </div>
        <h1 className="text-[44px] font-extrabold tracking-[-0.035em] m-0 mb-3.25 leading-[0.98]">
          {mon.name}
        </h1>
        <div className="flex gap-2 mb-4">
          {mon.types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
        <span className="inline-flex items-center gap-2 self-start text-[13px] font-bold text-ink bg-surface-2 border border-line rounded-[9px] px-3.25 py-1.5 mb-3.75">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          {role}
        </span>
        <p className="an-prose m-0 text-[15px] leading-[1.62] text-muted max-w-[92ch]">
          {overview}
        </p>
      </div>

      {/* Vitals */}
      <div className="flex flex-col border-l border-line-soft max-[1240px]:col-span-full max-[1240px]:flex-row max-[1240px]:border-l-0 max-[1240px]:border-t max-[820px]:flex-wrap">
        <div className="flex-1 flex flex-col justify-center gap-0.75 py-4 px-5.5 border-b border-line-soft max-[1240px]:border-b-0 max-[1240px]:border-r max-[820px]:flex-[1_1_45%]">
          <span className="text-[10.5px] font-bold tracking-[0.09em] uppercase text-faint">
            Usage
          </span>
          <span className="text-[22px] font-extrabold tracking-[-0.02em] flex items-baseline gap-0.75 font-mono">
            {usageRate.toFixed(1)}
            <small className="text-[13px] font-bold text-faint">%</small>
          </span>
          <span className="text-[11.5px] text-faint">3rd-most-used in OU</span>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-0.75 py-4 px-5.5 border-b border-line-soft max-[1240px]:border-b-0 max-[1240px]:border-r max-[820px]:flex-[1_1_45%]">
          <span className="text-[10.5px] font-bold tracking-[0.09em] uppercase text-faint">
            Base stat total
          </span>
          <span className="text-[22px] font-extrabold tracking-[-0.02em] font-mono">
            {total}
          </span>
          <span className="text-[11.5px] text-faint">
            Atk {mon.baseStats.atk} · bulky
          </span>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-0.75 py-4 px-5.5 border-b border-line-soft max-[1240px]:border-b-0 max-[1240px]:border-r max-[820px]:flex-[1_1_45%]">
          <span className="text-[10.5px] font-bold tracking-[0.09em] uppercase text-faint">
            Most-run item
          </span>
          <span className="text-[17px] font-extrabold tracking-[-0.02em]">
            {topItemName}
          </span>
          <span className="text-[11.5px] text-faint font-mono">
            {topItemPct.toFixed(1)}% of sets
          </span>
        </div>
        <div className="flex-1 flex flex-col justify-center gap-0.75 py-4 px-5.5 max-[820px]:flex-[1_1_45%]">
          <span className="text-[10.5px] font-bold tracking-[0.09em] uppercase text-faint">
            Viable sets
          </span>
          <span className="text-[22px] font-extrabold tracking-[-0.02em] font-mono">
            {setsCount}
          </span>
          <span className="text-[11.5px] text-faint">sweeper → support</span>
        </div>
      </div>
    </div>
  );
}
