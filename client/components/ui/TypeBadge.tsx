// Type colors and the canonical type list live in lib/browserUtils.ts and
// lib/typeChart.ts respectively — re-exported here so existing imports of
// `tc`/`ALL_TYPES` from this module keep working from a single source of truth.
import { tc } from "@/lib/browserUtils";
import { ALL_TYPES } from "@/lib/typeChart";

export { tc, ALL_TYPES };

export default function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className="text-white text-[11px] font-bold tracking-[0.01em] px-2.25 py-0.75 rounded-md capitalize"
      style={{ background: tc(type) }}
    >
      {type}
    </span>
  );
}
