import { defenseProfile, ALL_TYPES } from "@/lib/typeChart";
import { tc } from "@/lib/browserUtils";

// Listed strongest-weakness-first; only buckets that end up with at least one
// type (after filtering below) get rendered.
const BUCKETS = [
  { mult: 4, label: "4×", kind: "weak" as const },
  { mult: 2, label: "2×", kind: "weak" as const },
  { mult: 0.5, label: "½×", kind: "resist" as const },
  { mult: 0.25, label: "¼×", kind: "resist" as const },
  { mult: 0, label: "0×", kind: "immune" as const },
];

export default function DefenseCard({ types }: { types: string[] }) {
  // profile[attackingType] is the combined multiplier across both of this
  // mon's types (e.g. Rock/Dark takes 4x from Fighting) — see lib/typeChart.ts.
  const profile = defenseProfile(types);
  const buckets = BUCKETS.map((b) => ({
    ...b,
    types: ALL_TYPES.filter((t) => profile[t] === b.mult),
  })).filter((b) => b.types.length > 0);

  return (
    <section className="bg-surface border border-line rounded-[18px] p-5.5 py-6.5">
      <h2 className="flex items-center gap-2.25 text-[16px] font-extrabold tracking-[-0.015em] m-0 mb-4.5">
        Type defenses{" "}
        <span className="text-[11px] font-bold text-faint">
          incoming damage
        </span>
      </h2>
      <div className="flex flex-col gap-2.75">
        {buckets.map((b) => (
          <div
            key={b.label}
            className="grid grid-cols-[44px_1fr] items-center gap-3.5"
          >
            <span
              className={
                b.kind === "weak"
                  ? "font-mono text-[13px] font-extrabold text-center py-1.25 rounded-md text-white"
                  : b.kind === "resist"
                    ? "font-mono text-[13px] font-extrabold text-center py-1.25 rounded-md text-ink bg-surface-2 border border-line"
                    : "font-mono text-[13px] font-extrabold text-center py-1.25 rounded-md text-faint bg-surface-2 border border-dashed border-line"
              }
              style={
                b.kind === "weak"
                  ? {
                      background:
                        b.mult >= 4
                          ? "var(--like-fg)"
                          : "color-mix(in srgb, var(--like-fg) 80%, #000 6%)",
                    }
                  : undefined
              }
            >
              {b.label}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {b.types.map((t) => (
                <span
                  key={t}
                  className="text-[11.5px] font-bold capitalize text-white px-2.5 py-1 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.1)]"
                  style={{ background: tc(t) }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
