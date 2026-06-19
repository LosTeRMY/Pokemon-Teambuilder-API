import type { CSSProperties } from "react";
import { TIER_HUE, TIER_LABEL } from "@/lib/browserUtils";

export { TIER_HUE, TIER_LABEL };

export default function TierBadge({ hue, children }: { hue: string; children: React.ReactNode }) {
  return (
    <span className="tier-badge" style={{ "--th": hue } as CSSProperties}>
      {children}
    </span>
  );
}
