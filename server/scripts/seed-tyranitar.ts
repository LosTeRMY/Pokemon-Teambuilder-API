// One-time migration: moves Tyranitar's hand-written analysis out of the
// client's static client/app/pokedex/[slug]/data.ts and into the real
// pokemon_analyses/analysis_sets tables, now that community contributions are
// backed by the database (see server/src/services/analysisService.ts).
//
// The original data.ts attributed 3 of 4 sets to fictional contributor names
// (azureblade, sandstream_andy, ttar_enjoyer) that were never real registered
// users. Rather than inventing fake accounts to preserve that fake history,
// every set seeds in as an AI baseline (is_ai_draft = true, no author) —
// exactly the state any other Pokémon's first AI-drafted content would start
// in, awaiting real human review.
//
// Run with: npx tsx scripts/seed-tyranitar.ts (idempotent — skips if Tyranitar
// already has an analysis row).
import "dotenv/config";
import { db } from "../src/db";
import { pokemonAnalyses, analysisSets, analysisRevisions } from "../src/db/schema";
import { eq } from "drizzle-orm";
import pokemonsData from "../../data/pokemons.json";
import itemsData from "../../data/items.json";
import abilitiesData from "../../data/abilities.json";
import naturesData from "../../data/natures.json";

const slug = (name: string) =>
  name.toLowerCase().replace(/['’.:]/g, "").replace(/\s+/g, "").replace(/[^a-z0-9-]/g, "");

const pokemonIdBySlug = new Map(pokemonsData.map((p) => [slug(p.name), p.id]));
const itemIdByName = new Map(itemsData.map((i) => [i.name, i.id]));
const abilityIdByName = new Map(abilitiesData.map((a) => [a.name, a.id]));
const natureIdByName = new Map(naturesData.map((n) => [n.name, n.id]));

function resolveSlugs(slugs: string[]): number[] {
  return slugs.map((s) => {
    const id = pokemonIdBySlug.get(s);
    if (!id) throw new Error(`Unresolved Pokémon slug: ${s}`);
    return id;
  });
}

const TYRANITAR_SLUG = "tyranitar";

const PAGE = {
  role: "Sand-setting wallbreaker & late-game sweeper",
  overview:
    "Tyranitar is the bedrock of Generation IV OU. Its Sand Stream ability summons a permanent sandstorm that chips most of the tier and hands Tyranitar a passive 50% Special Defense boost, turning an already enormous 134 Attack and 110/100/100 bulk into a uniquely flexible package. It threatens nearly every relevant Pokémon with near-perfect Crunch + Stone Edge coverage, traps fleeing Psychic- and Ghost-types with Pursuit, and warps teambuilding around it: the sand it brings is as valuable to a team as the damage it deals. Whether it sets up a sweep, breaks walls off a Choice Band, or anchors a sand offense as a Stealth Rock lead, Tyranitar is on the shortlist of Pokémon every team must prepare for.",
};

const SETS = [
  {
    name: "Dragon Dance",
    role: "Late-game sweeper",
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
  },
  {
    name: "Choice Band",
    role: "Wallbreaker · trapper",
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
  },
  {
    name: "Choice Scarf",
    role: "Revenge killer",
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
  },
  {
    name: "Bulky Lead / Support",
    role: "Stealth Rock · sand anchor",
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
  },
];

async function main() {
  const pokemonId = pokemonIdBySlug.get(TYRANITAR_SLUG);
  if (!pokemonId) throw new Error("Tyranitar not found in data/pokemons.json");

  const [existing] = await db.select().from(pokemonAnalyses).where(eq(pokemonAnalyses.pokemonId, pokemonId));
  if (existing) {
    console.log("Tyranitar already has an analysis row — skipping (idempotent).");
    return;
  }

  const [analysis] = await db.insert(pokemonAnalyses).values({
    pokemonId,
    role: PAGE.role,
    overview: PAGE.overview,
    createdBy: null,
  }).returning();

  await db.insert(analysisRevisions).values({
    analysisId: analysis.id,
    setId: null,
    authorId: null,
    isAi: true,
    status: "pending",
    summary: "Seeded the initial overview as an AI baseline",
  });

  for (const [i, set] of SETS.entries()) {
    const itemId = itemIdByName.get(set.item);
    const abilityId = abilityIdByName.get(set.ability);
    const natureId = natureIdByName.get(set.nature);
    if (!itemId || !abilityId || !natureId) {
      throw new Error(`Unresolved item/ability/nature for set "${set.name}"`);
    }

    const [newSet] = await db.insert(analysisSets).values({
      analysisId: analysis.id,
      name: set.name,
      role: set.role,
      itemId,
      abilityId,
      natureId,
      evs: set.evs,
      moves: set.moves,
      analysis: set.analysis,
      evNote: set.evNote,
      teambuilding: set.teambuilding,
      matchupNote: set.matchupNote,
      handles: resolveSlugs(set.handles),
      threats: resolveSlugs(set.threats),
      isAiDraft: true,
      orderIndex: i,
      createdBy: null,
      updatedBy: null,
    }).returning();

    await db.insert(analysisRevisions).values({
      analysisId: analysis.id,
      setId: newSet.id,
      authorId: null,
      isAi: true,
      status: "pending",
      summary: `Seeded the "${set.name}" set as an AI baseline`,
    });
  }

  console.log(`Seeded Tyranitar (pokemon_id=${pokemonId}, analysis_id=${analysis.id}) with ${SETS.length} AI-baseline sets.`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => process.exit(0));
