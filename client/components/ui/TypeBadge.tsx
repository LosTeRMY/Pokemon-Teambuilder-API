const TYPE_COLORS: Record<string, string> = {
  normal:   "#a0a29f",
  fire:     "#e8554e",
  water:    "#538cce",
  electric: "#eed535",
  grass:    "#5db85c",
  ice:      "#74c5c5",
  fighting: "#cc3f3a",
  poison:   "#a55fa5",
  ground:   "#d97845",
  flying:   "#90a8dc",
  psychic:  "#e95e7d",
  bug:      "#91a119",
  rock:     "#c5b488",
  ghost:    "#5269ac",
  dragon:   "#5462d6",
  dark:     "#595761",
  steel:    "#5d93a5",
};

export const ALL_TYPES = Object.keys(TYPE_COLORS);
export const tc = (t: string) => TYPE_COLORS[t] ?? "#888";

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
