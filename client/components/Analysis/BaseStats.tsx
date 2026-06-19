import type { GBPokemon } from "@/lib/gameData";

const STAT_META = [
  { key: "hp", label: "HP", color: "#df5a52" },
  { key: "atk", label: "Atk", color: "#e8843c" },
  { key: "def", label: "Def", color: "#e6bd3a" },
  { key: "spa", label: "SpA", color: "#4b8de8" },
  { key: "spd", label: "SpD", color: "#4cae6a" },
  { key: "spe", label: "Spe", color: "#e07da4" },
] as const;
const STAT_MAX = 200; // bar-fill scale, not a real in-game cap — just keeps the longest bars from clipping

// Arbitrary flavor thresholds for the word shown next to each stat bar.
const statRating = (v: number) =>
  v >= 130
    ? "Excellent"
    : v >= 110
      ? "Great"
      : v >= 95
        ? "Good"
        : v >= 80
          ? "Decent"
          : v >= 65
            ? "Average"
            : v >= 50
              ? "Mediocre"
              : "Poor";

// Same flavor-text idea as statRating, but over HP + Def + SpD combined —
// a rough "how hard is this thing to kill" read, not a precise game stat.
const bulkRating = (hp: number, def: number, spd: number) => {
  const bulk = hp + def + spd;
  return bulk >= 320
    ? "Top-tier bulk"
    : bulk >= 280
      ? "Great bulk"
      : bulk >= 240
        ? "Good bulk"
        : bulk >= 200
          ? "Decent bulk"
          : bulk >= 160
            ? "Average bulk"
            : "Below-average bulk";
};

export default function BaseStats({ mon }: { mon: GBPokemon }) {
  const s = mon.baseStats;
  const total = s.hp + s.atk + s.def + s.spa + s.spd + s.spe;

  return (
    <section className="bg-surface border border-line rounded-[18px] p-5.5 py-6.5">
      <h2 className="flex items-center gap-2.25 text-[16px] font-extrabold tracking-[-0.015em] m-0 mb-4.5">
        Base stats{" "}
        <span className="ml-auto text-[11px] font-bold text-faint font-mono">
          BST {total}
        </span>
      </h2>
      <div className="flex flex-col gap-3">
        {STAT_META.map((m) => {
          const v = s[m.key as keyof typeof s];
          const w = Math.min(100, (v / STAT_MAX) * 100);
          return (
            <div
              key={m.key}
              className="grid grid-cols-[40px_40px_1fr_84px] items-center gap-3.5"
            >
              <span className="text-[13px] font-bold text-muted">
                {m.label}
              </span>
              <span className="text-[15px] font-extrabold text-right font-mono">
                {v}
              </span>
              <span className="h-2.5 rounded-md bg-surface-2 overflow-hidden shadow-[inset_0_0_0_1px_var(--line-soft)]">
                <i
                  className="block h-full rounded-md transition-[width] duration-600"
                  style={{ width: `${w}%`, background: m.color }}
                />
              </span>
              <span className="text-[12px] font-semibold text-faint text-right">
                {statRating(v)}
              </span>
            </div>
          );
        })}
        <div className="grid grid-cols-[40px_40px_1fr_84px] items-center gap-3.5 border-t border-line pt-3.25 mt-1">
          <span className="text-[15.5px] font-extrabold">Total</span>
          <span className="text-[15.5px] font-extrabold text-right font-mono">
            {total}
          </span>
          <span />
          <span className="text-[12px] font-bold text-muted text-right">
            {bulkRating(s.hp, s.def, s.spd)}
          </span>
        </div>
      </div>
    </section>
  );
}
