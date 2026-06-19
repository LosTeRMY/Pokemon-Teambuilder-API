import type { CSSProperties } from "react";

export const TIER_HUE: Record<string, string> = {
  ubers: "#7a3fd0",
  ou:    "#2f6fe0",
  uu:    "#2f9a55",
  nu:    "#d07f2a",
  pu:    "#8e6bbf",
  lc:    "#2a9dbf",
};

export const TIER_LABEL: Record<string, string> = {
  ubers: "Uber", ou: "OU", uu: "UU", nu: "NU", pu: "PU", lc: "LC",
};

export default function TierBadge({ hue, children }: { hue: string; children: React.ReactNode }) {
  return (
    <span className="tier-badge" style={{ "--th": hue } as CSSProperties}>
      {children}
    </span>
  );
}
