"use client";

import { useState } from "react";
import type { GBAbility } from "@/lib/gameData";
import { cn } from "@/lib/cn";

// Renders real GAMEDATA abilities for whatever mon is passed in — Tyranitar
// only has one (Sand Stream), so the tab switcher below just doesn't render,
// but the component itself stays generic for dual-ability mons.
export default function AbilityCard({ abilities }: { abilities: GBAbility[] }) {
  const [idx, setIdx] = useState(0);
  const multi = abilities.length > 1;
  const a = abilities[Math.min(idx, abilities.length - 1)]; // clamp in case the list ever shrinks under the selected tab
  if (!a) return null;

  return (
    <section className="bg-surface border border-line rounded-[18px] p-5.5 py-6.5">
      <h2 className="flex items-center gap-2.25 text-[16px] font-extrabold tracking-[-0.015em] m-0 mb-4.5">
        Ability
        {multi && (
          <span
            className="inline-flex gap-0.75 ml-2 bg-surface-2 border border-line rounded-[9px] p-0.75"
            role="tablist"
          >
            {abilities.map((ab, i) => (
              <button
                key={ab.id}
                role="tab"
                aria-selected={i === idx}
                className={cn(
                  "text-[12px] font-bold px-2.75 py-1.25 rounded-md text-muted transition-colors duration-140",
                  i === idx
                    ? "bg-surface text-accent shadow-[0_1px_2px_var(--shadow-card)]"
                    : "hover:text-ink",
                )}
                onClick={() => setIdx(i)}
              >
                {ab.name}
              </button>
            ))}
          </span>
        )}
      </h2>
      <div className="flex flex-col gap-1.75" key={a.id}>
        <div className="flex items-center gap-2.25">
          <span className="text-[16px] font-extrabold tracking-[-0.01em]">
            {a.name}
          </span>
        </div>
        <p className="an-prose m-0 text-[13.5px] leading-[1.55] text-muted">
          {a.description}
        </p>
      </div>
    </section>
  );
}
