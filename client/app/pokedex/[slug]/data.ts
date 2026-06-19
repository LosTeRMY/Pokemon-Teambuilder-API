/* data.ts — curated competitive-analysis content, keyed by Pokémon slug.
 * Stats, types, tier and ability text come from real game data (see page.tsx);
 * everything here (set writeups, usage stats, community activity) has no
 * real-data source yet, so it's hand-curated. Only "tyranitar" exists today —
 * every other slug 404s (see page.tsx) until someone curates more. */

export type AnalysisSet = {
  id: string;
  name: string;
  role: string;
  tier: string;
  nature: string;
  item: string;
  ability: string;
  evs: string;
  moves: string[];
  analysis: string;
  evNote: string;
  teambuilding: string;
  matchupNote: string;
  handles: string[];
  threats: string[];
  provenance: { kind: "human" | "ai"; author: string; reviewers?: number; updated: string; status?: string };
};

export type UsageRow = { name: string; pct: number; type?: string; slug?: string };

export type Usage = {
  rate: number;
  blurb: string;
  abilities: UsageRow[];
  items: UsageRow[];
  moves: UsageRow[];
  teammates: UsageRow[];
  spreads: { spread: string; pct: number }[];
};

export type Contributor = { name: string; edits: number; role: string; ai?: boolean };
export type Revision = { author: string; ai: boolean; status: "merged" | "review"; when: string; summary: string; target: string };
export type Proposal = {
  id: string; author: string; target: string; when: string; votes: number; status: "pending"; isNew?: boolean;
  note: string;
  build?: { item: string; ability: string; nature: string; evs: string; moves: string[] };
  analysis?: string; evNote?: string; teambuilding?: string; matchupNote?: string;
};

export type Community = { contributors: Contributor[]; revisions: Revision[]; proposals: Proposal[] };

export type MonAnalysis = {
  role: string;
  overview: string;
  sets: AnalysisSet[];
  usage: Usage;
  community: Community;
};

export const ANALYSIS_BY_SLUG: Record<string, MonAnalysis> = {
  tyranitar: {
    role: "Sand-setting wallbreaker & late-game sweeper",
    overview:
      "Tyranitar is the bedrock of Generation IV OU. Its Sand Stream ability summons a permanent sandstorm that chips most of the tier and hands Tyranitar a passive 50% Special Defense boost, turning an already enormous 134 Attack and 110/100/100 bulk into a uniquely flexible package. It threatens nearly every relevant Pokémon with near-perfect Crunch + Stone Edge coverage, traps fleeing Psychic- and Ghost-types with Pursuit, and warps teambuilding around it: the sand it brings is as valuable to a team as the damage it deals. Whether it sets up a sweep, breaks walls off a Choice Band, or anchors a sand offense as a Stealth Rock lead, Tyranitar is on the shortlist of Pokémon every team must prepare for.",
    sets: [
      {
        id: "dd",
        name: "Dragon Dance",
        role: "Late-game sweeper",
        tier: "ou",
        nature: "Adamant",
        item: "Lum Berry",
        ability: "Sand Stream",
        evs: "4 HP / 252 Atk / 252 Spe",
        moves: ["Dragon Dance", "Crunch", "Stone Edge", "Earthquake / Fire Punch"],
        analysis:
          "Dragon Dance Tyranitar is one of DPP OU's defining win conditions. A single boost vaults it past the unboosted metagame, and from there Crunch and Stone Edge form near-perfect neutral coverage that 2HKOes most of the tier even before sand chip is factored in. Lum Berry is the glue: it lets Tyranitar set up on a predicted Will-O-Wisp from Rotom-H or a sleep/paralysis attempt and immediately threaten a sweep. Earthquake is the preferred last slot to punish Steel-types like Metagross and Jirachi, though Fire Punch can be run to more reliably break Skarmory and Forretress.",
        evNote:
          "Adamant with maximum Attack and Speed is the standard — after a Dragon Dance, max Speed lets Tyranitar outpace the entire unboosted tier and most Choice Scarf users, while max Attack guarantees its key 2HKOs. The 4 HP EVs round the number to reduce Stealth Rock damage. Jolly is an option if you specifically want to win the +1 mirror against other base-100 sweepers.",
        teambuilding:
          "Magnezone is the premier partner: it traps and removes the Skarmory, Bronzong, and Forretress that wall a boosted Tyranitar. Stack entry hazards with a Stealth Rock + Spikes user so neutral targets drop into KO range, and keep a Fighting-type like Heracross or a strong priority user around to soften the faster Scarf revenge killers that threaten it.",
        matchupNote:
          "Set up freely on passive walls and predicted status — Lum Berry means a single Will-O-Wisp or Thunder Wave just gets eaten. The danger is faster priority and Scarfers: Scizor's Bullet Punch, Lucario's ExtremeSpeed, and Mamoswine's Ice Shard all threaten it after chip, so clear them before sweeping.",
        handles: ["heatran", "jirachi", "zapdos", "starmie"],
        threats: ["scizor", "lucario", "swampert", "gliscor"],
        provenance: { kind: "human", author: "azureblade", reviewers: 9, updated: "2 days ago" },
      },
      {
        id: "band",
        name: "Choice Band",
        role: "Wallbreaker · trapper",
        tier: "ou",
        nature: "Adamant",
        item: "Choice Band",
        ability: "Sand Stream",
        evs: "4 HP / 252 Atk / 252 Spe",
        moves: ["Crunch", "Stone Edge", "Pursuit", "Earthquake / Superpower"],
        analysis:
          "Choice Band turns Tyranitar into one of the scariest immediate-pressure breakers in the format. Band Crunch dents even resists, Stone Edge blows past anything that doesn't resist Rock, and Pursuit is the real prize — it traps and removes the Latias, Starmie, and Gengar that would otherwise pivot in freely, often OHKOing them as they flee. Earthquake rounds out coverage for opposing Tyranitar and Steels, while Superpower is an option to crush Blissey and Snorlax on the switch. The lack of Speed control is the cost of the raw power.",
        evNote:
          "Maximum Attack and Speed, Adamant. Speed creep matters even without a boosting move — base 61 Speed with max investment sneaks past defensive Skarmory and slower Tyranitar, and the full Attack investment is what powers Band Pursuit into a clean OHKO on fleeing Latias and Starmie.",
        teambuilding:
          "Choice Band Tyranitar wants slow pivots — Zapdos, Rotom-H, or a U-turn user — to bring it in safely on a forced switch, since its locked moves make free entry valuable. Keep a Choice Scarf user or priority attacker in the back to clean up the faster threats it can't revenge itself.",
        matchupNote:
          "This set's identity is trapping: locked-in Psychic- and Ghost-types die to Band Pursuit as they switch. Be careful clicking a move — being Choice-locked into Crunch lets a Machamp or Lucario come in free and OHKO back. Predict the switch, don't auto-pilot.",
        handles: ["latias", "starmie", "gengar", "blissey"],
        threats: ["machamp", "lucario", "scizor", "gliscor"],
        provenance: { kind: "human", author: "sandstream_andy", reviewers: 6, updated: "5 days ago" },
      },
      {
        id: "scarf",
        name: "Choice Scarf",
        role: "Revenge killer",
        tier: "ou",
        nature: "Jolly",
        item: "Choice Scarf",
        ability: "Sand Stream",
        evs: "252 Atk / 4 SpD / 252 Spe",
        moves: ["Crunch", "Stone Edge", "Pursuit", "Earthquake"],
        analysis:
          "A Choice Scarf set trades the sweeping ceiling of Dragon Dance for reliable revenge-killing and a frightening trapping role. Jolly Scarf Tyranitar outspeeds the entire unboosted tier and most Choice Scarf users, letting it pick off weakened threats and +1 sweepers that slip past the team. Its signature trick is Scarf Pursuit: because the opponent expects a slower Tyranitar, locked-in Psychic- and Ghost-types try to flee and eat a doubled-power Pursuit they can't outrun. Stone Edge and Earthquake handle the rest of the coverage Crunch misses.",
        evNote:
          "252 Atk / 252 Spe with a Jolly nature is non-negotiable here — the entire point of the set is outspeeding the metagame, so maximum Speed comes first and maximum Attack makes the revenge kills clean. The lone 4 SpD EV is filler that dodges a Download boost and rounds the spread.",
        teambuilding:
          "Scarf Tyranitar is glue for offensive teams that need a panic button against +1 sweepers like Salamence, Gyarados, and Dragon Dance Tyranitar. Pair it with setup sweepers of your own that appreciate those threats being removed, and with hazard support so its revenge kills and Pursuit traps fall into range more reliably.",
        matchupNote:
          "Outspeeds and revenges the unboosted tier plus most Scarfers — Gengar, Azelf, Infernape, and Starmie all fall, and Scarf Pursuit traps the Psychic- and Ghost-types that expect a slower Tyranitar. It struggles against priority users (Scizor, Lucario, Mamoswine) and anything bulky enough to survive a hit and threaten back, since it can't boost or switch moves freely.",
        handles: ["gengar", "azelf", "infernape", "starmie"],
        threats: ["scizor", "lucario", "mamoswine", "swampert"],
        provenance: { kind: "human", author: "ttar_enjoyer", reviewers: 4, updated: "1 week ago" },
      },
      {
        id: "lead",
        name: "Bulky Lead / Support",
        role: "Stealth Rock · sand anchor",
        tier: "ou",
        nature: "Sassy",
        item: "Chople Berry",
        ability: "Sand Stream",
        evs: "252 HP / 4 Atk / 252 SpD",
        moves: ["Stealth Rock", "Crunch", "Pursuit", "Fire Blast / Superpower"],
        analysis:
          "Sand Stream plus the Special Defense boost makes Tyranitar an outstanding bulky lead and pivot that fits onto nearly any team needing Stealth Rock. It reliably gets hazards up, threatens opposing leads, and uses Pursuit to keep removing the Psychic- and Ghost-types that pressure sand teams. Fire Blast is the key surprise factor — it OHKOes the Scizor, Forretress, and Skarmory that otherwise wall this set, despite the uninvested Special Attack. Chople Berry softens incoming Close Combats and Superpowers, letting Tyranitar live a Fighting hit it would normally fear and retaliate.",
        evNote:
          "A fully specially-defensive 252 HP / 252 SpD Sassy spread leans on Sand Stream's boost to hard-wall the special attackers of the tier — Latias, Zapdos, and Starmie all fail to break it. The 4 Attack EVs are filler; shift EVs into Speed only if you want to creep opposing leads before setting Stealth Rock.",
        teambuilding:
          "As a Stealth Rock setter and special sponge, this Tyranitar wants a dedicated physical wall beside it — Skarmory or Hippowdon — to cover the Fighting- and Ground-types it fears. A spinblocker such as Rotom-H keeps its hazards on the field, and the permanent sand supports overtly offensive teammates.",
        matchupNote:
          "It walls the special side of the tier almost for free, but physical Fighting- and Ground-types blow straight through it — Machamp, Infernape, and Swampert all OHKO or 2HKO. Lean on Chople Berry to survive one Fighting hit and Pursuit-trap the frailer special threats it forces out.",
        handles: ["azelf", "zapdos", "gengar", "starmie"],
        threats: ["machamp", "infernape", "swampert", "breloom"],
        provenance: { kind: "ai", author: "Claude", reviewers: 1, updated: "yesterday", status: "needs-review" },
      },
    ],
    usage: {
      rate: 57.127,
      blurb: "of Gen 4 OU teams carry Tyranitar — the third-most-used Pokémon in the tier.",
      abilities: [{ name: "Sand Stream", pct: 100 }],
      items: [
        { name: "Lum Berry", pct: 29.245 },
        { name: "Choice Band", pct: 21.621 },
        { name: "Choice Scarf", pct: 11.153 },
        { name: "Chople Berry", pct: 9.011 },
        { name: "Leftovers", pct: 8.641 },
        { name: "Shuca Berry", pct: 7.551 },
        { name: "Yache Berry", pct: 6.598 },
        { name: "Cheri Berry", pct: 4.053 },
      ],
      moves: [
        { name: "Crunch", type: "dark", pct: 94.923 },
        { name: "Pursuit", type: "dark", pct: 54.571 },
        { name: "Superpower", type: "fighting", pct: 43.680 },
        { name: "Earthquake", type: "ground", pct: 42.158 },
        { name: "Stone Edge", type: "rock", pct: 37.004 },
        { name: "Dragon Dance", type: "dragon", pct: 35.181 },
        { name: "Fire Punch", type: "fire", pct: 23.714 },
        { name: "Fire Blast", type: "fire", pct: 12.211 },
        { name: "Stealth Rock", type: "rock", pct: 11.607 },
        { name: "Ice Punch", type: "ice", pct: 8.323 },
        { name: "Aqua Tail", type: "water", pct: 7.292 },
        { name: "Taunt", type: "dark", pct: 7.260 },
        { name: "Toxic", type: "poison", pct: 3.929 },
      ],
      teammates: [
        { name: "Jirachi", slug: "jirachi", pct: 44.087 },
        { name: "Latias", slug: "latias", pct: 40.662 },
        { name: "Gyarados", slug: "gyarados", pct: 39.590 },
        { name: "Metagross", slug: "metagross", pct: 31.928 },
        { name: "Azelf", slug: "azelf", pct: 23.437 },
        { name: "Infernape", slug: "infernape", pct: 21.024 },
        { name: "Starmie", slug: "starmie", pct: 20.088 },
        { name: "Flygon", slug: "flygon", pct: 19.211 },
        { name: "Dragonite", slug: "dragonite", pct: 16.777 },
        { name: "Zapdos", slug: "zapdos", pct: 16.395 },
      ],
      spreads: [
        { spread: "252 Atk / 4 SpD / 252+ Spe", pct: 28.238 },
        { spread: "252 Atk / 4 Def / 252+ Spe", pct: 7.788 },
        { spread: "8 HP / 248 Atk / 252+ Spe", pct: 4.597 },
        { spread: "48 HP / 144+ Atk / 52 SpA / 184 SpD / 80 Spe", pct: 4.036 },
        { spread: "180 HP / 252+ Atk / 76 Spe", pct: 3.965 },
        { spread: "48 HP / 188+ Atk / 4 SpA / 64 SpD / 204 Spe", pct: 2.379 },
      ],
    },
    community: {
      contributors: [
        { name: "azureblade", edits: 34, role: "Maintainer" },
        { name: "sandstream_andy", edits: 18, role: "Editor" },
        { name: "ttar_enjoyer", edits: 12, role: "Editor" },
        { name: "Claude", edits: 7, role: "AI draft", ai: true },
      ],
      revisions: [
        { author: "azureblade", ai: false, status: "merged", when: "2 days ago", summary: "Clarified Earthquake vs. Fire Punch on the Dragon Dance set", target: "Dragon Dance" },
        { author: "sandstream_andy", ai: false, status: "merged", when: "5 days ago", summary: "Added Superpower mention for the Choice Band set", target: "Choice Band" },
        { author: "Claude", ai: true, status: "review", when: "yesterday", summary: "Drafted the Bulky Lead / Support baseline analysis", target: "Bulky Lead / Support" },
        { author: "ttar_enjoyer", ai: false, status: "review", when: "yesterday", summary: "Proposed reworking the Choice Scarf trapping paragraph", target: "Choice Scarf" },
      ],
      proposals: [
        {
          id: "p2", author: "specs_andy", target: "Choice Specs", when: "3 hours ago", votes: 12, status: "pending", isNew: true,
          note: "Specs Tyranitar is a genuinely underrated breaker — sand-boosted Fire Blast + Dark Pulse blows past the special walls that stop the physical sets cold. Worth documenting as its own set.",
          build: { item: "Choice Specs", ability: "Sand Stream", nature: "Modest", evs: "4 Def / 252 SpA / 252 Spe", moves: ["Dark Pulse", "Fire Blast", "Ice Beam", "Flash Cannon"] },
          analysis: "An all-out special attacker that flips Tyranitar's usual checks on their head. Specs-boosted Dark Pulse and Fire Blast threaten the Skarmory, Bronzong, and Forretress that wall the physical sets, while the surprise factor — almost nobody plays around special Tyranitar — wins games on its own the first time it's revealed.",
          evNote: "Modest with maximum Special Attack and Speed maximises the breaking power and lets it creep past defensive base-70s. The 4 Def EVs are filler; a Timid nature is an option purely to win the mirror against other base-61 speed creepers.",
          teambuilding: "Wants the same hazard support as any breaker, plus a physical attacker to share the load — once Specs Tyranitar lures and weakens the special walls, a Choice Band partner cleans up. Pair with a spinblocker to keep Stealth Rock chipping its targets.",
          matchupNote: "Breaks the special walls that hard-stop physical Tyranitar — Blissey aside, most of the tier folds to the right click. The cost is predictability: once revealed it's easy to play around, and being Choice-locked into a resisted move invites a free switch.",
        },
        {
          id: "p1", author: "ttar_enjoyer", target: "Choice Scarf", when: "yesterday", votes: 5, status: "pending",
          note: "The current Scarf write-up undersells how it checks +1 Salamence and Gyarados — worth calling those out by name.",
        },
      ],
    },
  },
};
