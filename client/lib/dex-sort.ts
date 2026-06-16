type Sortable = { name: string; tier: string };

// ── Tunable constants ────────────────────────────────────────────────────────

// How many cards in the "featured" top section
const TOP_N = 30;

// Exact counts drawn from each tier for those 30 slots.
// Must sum to TOP_N. Shuffle happens after, so order within section is random.
const TOP_COUNTS: Array<{ tier: string; count: number }> = [
  { tier: "ou",    count: 20 }, // ~65%
  { tier: "ubers", count:  6 }, // ~20%
  { tier: "uu",    count:  3 }, // ~10%
  { tier: "nu",    count:  1 }, // ~ 5%
];

// Spread used to order Pokémon *within* each remaining section (after top N)
const TIER_SPREAD: Record<string, number> = {
  ou:    160,
  ubers: 130,
  uu:    100,
  nubl:   82,
  nu:     70,
  publ:   48,
  pu:     40,
  zubl:   28,
  lc:     16,
};

const ARCEUS_PREFIX = "arceus";

// Per-Pokémon bucket overrides — reassigns appearance rate without touching the JSON tier.
const BUCKET_OVERRIDES: Record<string, string> = {
  Ninjask:  "uu",
  Wynaut:   "lower",
  Smeargle: "nu",
  Umbreon:  "uu",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function scoreSort<T extends Sortable>(arr: T[]): T[] {
  return arr
    .map(p => ({ p, s: Math.random() * (TIER_SPREAD[p.tier] ?? 40) }))
    .sort((a, b) => b.s - a.s)
    .map(x => x.p);
}

// ── Main export ──────────────────────────────────────────────────────────────

export function weightedDexSort<T extends Sortable>(pokemon: T[]): T[] {
  // Single pass: find all Arceus indices, pick one to float up
  const arceusIndices: number[] = [];
  for (let i = 0; i < pokemon.length; i++) {
    if (pokemon[i].name.toLowerCase().startsWith(ARCEUS_PREFIX)) arceusIndices.push(i);
  }
  const featuredIdx = arceusIndices.length > 0
    ? arceusIndices[Math.floor(Math.random() * arceusIndices.length)]
    : -1;

  // Single pass: bucket every Pokémon
  const pools: Record<string, T[]> = { ou: [], ubers: [], uu: [], nu: [], lower: [] };

  for (let i = 0; i < pokemon.length; i++) {
    const p = pokemon[i];
    if (i !== featuredIdx && p.name.toLowerCase().startsWith(ARCEUS_PREFIX)) {
      pools.lower.push(p); continue;
    }
    const bucket = BUCKET_OVERRIDES[p.name] ?? p.tier;
    if      (bucket === "ou"   ) pools.ou.push(p);
    else if (bucket === "ubers") pools.ubers.push(p);
    else if (bucket === "uu"   ) pools.uu.push(p);
    else if (bucket === "nu" || bucket === "nubl") pools.nu.push(p);
    else pools.lower.push(p);
  }

  for (const pool of Object.values(pools)) shuffle(pool);

  // Top N: quota sampling — pop() from shuffled array is O(1)
  const topSection: T[] = [];
  for (const { tier, count } of TOP_COUNTS) {
    const pool = pools[tier];
    const take = Math.min(count, pool.length);
    for (let i = 0; i < take; i++) topSection.push(pool.pop()!);
  }
  shuffle(topSection);

  const remainingUpper = scoreSort([...pools.ou, ...pools.ubers, ...pools.uu]);
  const lowerSection   = scoreSort([...pools.nu, ...pools.lower]);

  return [...topSection, ...remainingUpper, ...lowerSection];
}
