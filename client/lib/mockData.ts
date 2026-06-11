import { pokeByName, moveByName, abilByName, itemByName, natByName } from './lookups';

type RawMember = {
  n: string; s: string; t: string[];
  item: string; abil: string; nat: string; moves: string[];
};

export type BrowserMember = RawMember & {
  pid: number | null;
  moveIds: number[];
  abilId: number | null;
  itemId: number | null;
  natId: number | null;
};

export type BrowserTeam = {
  id: number;
  name: string;
  format: number;
  author: { id: number; name: string };
  createdAt: string;
  likes: number;
  liked: boolean;
  description: string;
  members: BrowserMember[];
};

const m = (n: string, s: string, t: string[], item: string, abil: string, nat: string, moves: string[]): RawMember =>
  ({ n, s, t, item, abil, nat, moves });

function resolve(raw: RawMember): BrowserMember {
  return {
    ...raw,
    pid:    pokeByName.get(raw.n.toLowerCase()) ?? null,
    moveIds: raw.moves.map((mv) => moveByName.get(mv.toLowerCase())).filter((x): x is number => x != null),
    abilId: abilByName.get(raw.abil.toLowerCase()) ?? null,
    itemId: raw.item ? (itemByName.get(raw.item.toLowerCase()) ?? null) : null,
    natId:  natByName.get(raw.nat.toLowerCase()) ?? null,
  };
}

const RAW_TEAMS: Array<Omit<BrowserTeam, 'members'> & { members: RawMember[] }> = [
  {
    id: 1, name: "Standard Sand Balance", format: 2,
    author: { id: 11, name: "azureblade" },
    createdAt: "2026-05-31", likes: 412, liked: true,
    description: "Tyranitar + Hippowdon backbone with Scizor pursuit support. The bread-and-butter DPP OU balance.",
    members: [
      m("Tyranitar","tyranitar",["rock","dark"],"Leftovers","Sand Stream","Careful",["Stealth Rock","Crunch","Pursuit","Roar"]),
      m("Hippowdon","hippowdon",["ground"],"Leftovers","Sand Stream","Impish",["Earthquake","Slack Off","Roar","Stealth Rock"]),
      m("Scizor","scizor",["bug","steel"],"Choice Band","Technician","Adamant",["Bullet Punch","U-turn","Pursuit","Superpower"]),
      m("Rotom-Wash","rotom-wash",["electric","ghost"],"Leftovers","Levitate","Bold",["Thunderbolt","Hydro Pump","Will-O-Wisp","Pain Split"]),
      m("Latias","latias",["dragon","psychic"],"Soul Dew","Levitate","Timid",["Draco Meteor","Surf","Recover","Thunderbolt"]),
      m("Breloom","breloom",["grass","fighting"],"Toxic Orb","Poison Heal","Adamant",["Spore","Seed Bomb","Mach Punch","Substitute"]),
    ],
  },
  {
    id: 2, name: "SkarmBliss Stall", format: 2,
    author: { id: 12, name: "wallmaster" },
    createdAt: "2026-05-28", likes: 351, liked: false,
    description: "Full stall. Skarmory + Blissey core, Gliscor + Tentacruel for hazards and pivoting. Win by attrition.",
    members: [
      m("Skarmory","skarmory",["steel","flying"],"Shed Shell","Keen Eye","Impish",["Spikes","Roost","Whirlwind","Brave Bird"]),
      m("Blissey","blissey",["normal"],"Leftovers","Natural Cure","Calm",["Seismic Toss","Softboiled","Toxic","Aromatherapy"]),
      m("Tentacruel","tentacruel",["water","poison"],"Black Sludge","Liquid Ooze","Calm",["Rapid Spin","Toxic Spikes","Scald","Protect"]),
      m("Gliscor","gliscor",["ground","flying"],"Leftovers","Sand Veil","Impish",["Earthquake","Roost","Taunt","Stealth Rock"]),
      m("Rotom-Wash","rotom-wash",["electric","ghost"],"Leftovers","Levitate","Bold",["Thunderbolt","Hydro Pump","Will-O-Wisp","Pain Split"]),
      m("Tyranitar","tyranitar",["rock","dark"],"Leftovers","Sand Stream","Sassy",["Crunch","Pursuit","Ice Beam","Fire Blast"]),
    ],
  },
  {
    id: 3, name: "Rain Dance Hyper Offense", format: 2,
    author: { id: 13, name: "drizzle_dan" },
    createdAt: "2026-06-03", likes: 287, liked: false,
    description: "Manual rain off Kingdra. Swift Swim sweepers everywhere — set it and clean up.",
    members: [
      m("Kingdra","kingdra",["water","dragon"],"Life Orb","Swift Swim","Modest",["Hydro Pump","Draco Meteor","Surf","Rain Dance"]),
      m("Ludicolo","ludicolo",["water","grass"],"Life Orb","Swift Swim","Modest",["Hydro Pump","Energy Ball","Ice Beam","Rain Dance"]),
      m("Kabutops","kabutops",["rock","water"],"Life Orb","Swift Swim","Adamant",["Waterfall","Stone Edge","Aqua Jet","Swords Dance"]),
      m("Qwilfish","qwilfish",["water","poison"],"Life Orb","Swift Swim","Adamant",["Waterfall","Poison Jab","Explosion","Swords Dance"]),
      m("Azelf","azelf",["psychic"],"Focus Sash","Levitate","Jolly",["Stealth Rock","Taunt","Explosion","Psychic"]),
      m("Bronzong","bronzong",["steel","psychic"],"Damp Rock","Levitate","Sassy",["Rain Dance","Gyro Ball","Hypnosis","Explosion"]),
    ],
  },
  {
    id: 4, name: "Lati Offense", format: 2,
    author: { id: 11, name: "azureblade" },
    createdAt: "2026-06-07", likes: 198, liked: true,
    description: "Soul Dew Latias glues an offensive core of Heatran, Scizor and Lucario. Fast and flexible.",
    members: [
      m("Latias","latias",["dragon","psychic"],"Soul Dew","Levitate","Timid",["Draco Meteor","Surf","Recover","Roar"]),
      m("Heatran","heatran",["fire","steel"],"Choice Scarf","Flash Fire","Naive",["Fire Blast","Earth Power","Explosion","Dragon Pulse"]),
      m("Scizor","scizor",["bug","steel"],"Life Orb","Technician","Adamant",["Swords Dance","Bullet Punch","Bug Bite","Superpower"]),
      m("Lucario","lucario",["fighting","steel"],"Life Orb","Inner Focus","Jolly",["Swords Dance","Close Combat","Extreme Speed","Crunch"]),
      m("Starmie","starmie",["water","psychic"],"Life Orb","Natural Cure","Timid",["Hydro Pump","Thunderbolt","Ice Beam","Rapid Spin"]),
      m("Jirachi","jirachi",["steel","psychic"],"Leftovers","Serene Grace","Jolly",["Stealth Rock","Iron Head","Body Slam","U-turn"]),
    ],
  },
  {
    id: 5, name: "Gyarados Dragon Dance", format: 2,
    author: { id: 14, name: "intimidator" },
    createdAt: "2026-05-20", likes: 240, liked: false,
    description: "Classic DD Gyarados sweep with Magnezone trapping its steel checks. Bulky support behind.",
    members: [
      m("Gyarados","gyarados",["water","flying"],"Life Orb","Intimidate","Adamant",["Dragon Dance","Waterfall","Stone Edge","Earthquake"]),
      m("Magnezone","magnezone",["electric","steel"],"Choice Scarf","Magnet Pull","Modest",["Thunderbolt","Hidden Power Fire","Flash Cannon","Explosion"]),
      m("Celebi","celebi",["grass","psychic"],"Leftovers","Natural Cure","Bold",["Grass Knot","Recover","Thunder Wave","U-turn"]),
      m("Tyranitar","tyranitar",["rock","dark"],"Choice Band","Sand Stream","Adamant",["Stone Edge","Crunch","Pursuit","Earthquake"]),
      m("Swampert","swampert",["water","ground"],"Leftovers","Torrent","Relaxed",["Stealth Rock","Earthquake","Ice Beam","Roar"]),
      m("Rotom-Wash","rotom-wash",["electric","ghost"],"Leftovers","Levitate","Timid",["Thunderbolt","Shadow Ball","Hydro Pump","Trick"]),
    ],
  },
  {
    id: 6, name: "Infernape Spikes Offense", format: 2,
    author: { id: 15, name: "blaze_it" },
    createdAt: "2026-06-01", likes: 176, liked: false,
    description: "Skarmory spikes + Infernape and Weavile to abuse them. Relentless offensive pressure.",
    members: [
      m("Infernape","infernape",["fire","fighting"],"Life Orb","Blaze","Naive",["Close Combat","Fire Blast","Grass Knot","Mach Punch"]),
      m("Weavile","weavile",["dark","ice"],"Life Orb","Pressure","Jolly",["Ice Shard","Night Slash","Ice Punch","Pursuit"]),
      m("Skarmory","skarmory",["steel","flying"],"Custap Berry","Keen Eye","Jolly",["Spikes","Stealth Rock","Brave Bird","Taunt"]),
      m("Starmie","starmie",["water","psychic"],"Life Orb","Natural Cure","Timid",["Hydro Pump","Thunderbolt","Ice Beam","Rapid Spin"]),
      m("Salamence","salamence",["dragon","flying"],"Life Orb","Intimidate","Naive",["Draco Meteor","Fire Blast","Earthquake","Roost"]),
      m("Magnezone","magnezone",["electric","steel"],"Choice Scarf","Magnet Pull","Modest",["Thunderbolt","Hidden Power Fire","Flash Cannon","Explosion"]),
    ],
  },
  {
    id: 7, name: "Standard Ubers Goodstuff", format: 1,
    author: { id: 16, name: "primal_god" },
    createdAt: "2026-06-05", likes: 309, liked: false,
    description: "Dialga + Kyogre + Groudon core with Giratina-O and Latias glue. The Ubers staple.",
    members: [
      m("Dialga","dialga",["steel","dragon"],"Leftovers","Pressure","Modest",["Draco Meteor","Flamethrower","Thunder","Stealth Rock"]),
      m("Kyogre","kyogre",["water"],"Choice Scarf","Drizzle","Timid",["Water Spout","Surf","Thunder","Ice Beam"]),
      m("Groudon","groudon",["ground"],"Leftovers","Drought","Adamant",["Stealth Rock","Earthquake","Dragon Claw","Stone Edge"]),
      m("Giratina-Origin","giratina-origin",["ghost","dragon"],"Griseous Orb","Levitate","Naive",["Shadow Sneak","Dragon Claw","Earthquake","Outrage"]),
      m("Latias","latias",["dragon","psychic"],"Soul Dew","Levitate","Timid",["Draco Meteor","Surf","Recover","Thunder"]),
      m("Scizor","scizor",["bug","steel"],"Choice Band","Technician","Adamant",["Bullet Punch","U-turn","Pursuit","Superpower"]),
    ],
  },
  {
    id: 8, name: "Mewtwo Hyper Offense", format: 1,
    author: { id: 17, name: "genome" },
    createdAt: "2026-05-26", likes: 221, liked: true,
    description: "Deoxys-A leads, Mewtwo and Darkrai clean. All-out offense for the Ubers ladder.",
    members: [
      m("Deoxys-Attack","deoxys-attack",["psychic"],"Focus Sash","Pressure","Naive",["Stealth Rock","Spikes","Taunt","Psycho Boost"]),
      m("Mewtwo","mewtwo",["psychic"],"Life Orb","Pressure","Timid",["Psystrike","Aura Sphere","Ice Beam","Calm Mind"]),
      m("Darkrai","darkrai",["dark"],"Life Orb","Bad Dreams","Timid",["Dark Void","Dark Pulse","Focus Blast","Nasty Plot"]),
      m("Kyogre","kyogre",["water"],"Choice Specs","Drizzle","Modest",["Water Spout","Surf","Thunder","Ice Beam"]),
      m("Garchomp","garchomp",["dragon","ground"],"Choice Scarf","Sand Veil","Jolly",["Outrage","Earthquake","Fire Fang","Stone Edge"]),
      m("Latias","latias",["dragon","psychic"],"Soul Dew","Levitate","Timid",["Draco Meteor","Surf","Recover","Thunder"]),
    ],
  },
  {
    id: 9, name: "Bulky Offense UU", format: 3,
    author: { id: 18, name: "tierwhisper" },
    createdAt: "2026-06-04", likes: 143, liked: false,
    description: "Milotic + Registeel defensive core enabling Venusaur and Moltres to break holes.",
    members: [
      m("Milotic","milotic",["water"],"Leftovers","Marvel Scale","Bold",["Surf","Recover","Ice Beam","Haze"]),
      m("Venusaur","venusaur",["grass","poison"],"Black Sludge","Overgrow","Bold",["Leech Seed","Sleep Powder","Giga Drain","Sludge Bomb"]),
      m("Registeel","registeel",["steel"],"Leftovers","Clear Body","Careful",["Stealth Rock","Iron Head","Thunder Wave","Rest"]),
      m("Moltres","moltres",["fire","flying"],"Life Orb","Pressure","Timid",["Fire Blast","Air Slash","Hidden Power Grass","Roost"]),
      m("Hitmontop","hitmontop",["fighting"],"Leftovers","Technician","Impish",["Rapid Spin","Close Combat","Mach Punch","Sucker Punch"]),
      m("Spiritomb","spiritomb",["ghost","dark"],"Leftovers","Pressure","Calm",["Will-O-Wisp","Shadow Ball","Dark Pulse","Pain Split"]),
    ],
  },
  {
    id: 10, name: "Sunny Day Houndoom", format: 3,
    author: { id: 15, name: "blaze_it" },
    createdAt: "2026-05-18", likes: 98, liked: false,
    description: "Niche sun offense in UU. Houndoom and Venusaur under harsh sunlight.",
    members: [
      m("Houndoom","houndoom",["dark","fire"],"Life Orb","Flash Fire","Timid",["Fire Blast","Dark Pulse","Sunny Day","Hidden Power Grass"]),
      m("Venusaur","venusaur",["grass","poison"],"Life Orb","Chlorophyll","Modest",["Solar Beam","Sludge Bomb","Growth","Sleep Powder"]),
      m("Uxie","uxie",["psychic"],"Leftovers","Levitate","Bold",["Stealth Rock","Yawn","U-turn","Psychic"]),
      m("Donphan","donphan",["ground"],"Leftovers","Sturdy","Impish",["Rapid Spin","Earthquake","Ice Shard","Stealth Rock"]),
      m("Milotic","milotic",["water"],"Leftovers","Marvel Scale","Bold",["Surf","Recover","Ice Beam","Hypnosis"]),
      m("Scyther","scyther",["bug","flying"],"Choice Band","Technician","Jolly",["U-turn","Aerial Ace","Brick Break","Pursuit"]),
    ],
  },
  {
    id: 11, name: "Trick Room NU", format: 4,
    author: { id: 19, name: "slowmo" },
    createdAt: "2026-05-30", likes: 87, liked: false,
    description: "Gardevoir sets Trick Room, slow heavy hitters sweep. Underrated lower-tier cheese.",
    members: [
      m("Gardevoir","gardevoir",["psychic"],"Leftovers","Synchronize","Quiet",["Trick Room","Psychic","Focus Blast","Will-O-Wisp"]),
      m("Marowak","marowak",["ground"],"Thick Club","Rock Head","Brave",["Earthquake","Stone Edge","Fire Punch","Double-Edge"]),
      m("Gorebyss","gorebyss",["water"],"Leftovers","Swift Swim","Quiet",["Surf","Ice Beam","Hidden Power Grass","Trick Room"]),
      m("Glalie","glalie",["ice"],"Focus Sash","Inner Focus","Hasty",["Spikes","Ice Beam","Explosion","Taunt"]),
      m("Hariyama","hariyama",["fighting"],"Leftovers","Thick Fat","Brave",["Close Combat","Payback","Fake Out","Ice Punch"]),
      m("Rotom","rotom",["electric","ghost"],"Leftovers","Levitate","Quiet",["Trick Room","Thunderbolt","Shadow Ball","Will-O-Wisp"]),
    ],
  },
  {
    id: 12, name: "Little Cup Sand", format: 6,
    author: { id: 20, name: "smollest" },
    createdAt: "2026-06-08", likes: 64, liked: false,
    description: "LC sand offense. Tiny mons, big damage. Bronzor walls the world.",
    members: [
      m("Bulbasaur","bulbasaur",["grass","poison"],"Eviolite","Overgrow","Calm",["Sleep Powder","Giga Drain","Leech Seed","Sludge Bomb"]),
      m("Munchlax","munchlax",["normal"],"Oran Berry","Thick Fat","Careful",["Body Slam","Pursuit","Fire Punch","Rest"]),
      m("Gastly","gastly",["ghost","poison"],"Life Orb","Levitate","Timid",["Shadow Ball","Sludge Bomb","Hidden Power Fighting","Substitute"]),
      m("Chinchou","chinchou",["water","electric"],"Eviolite","Volt Absorb","Modest",["Hydro Pump","Thunderbolt","Ice Beam","Volt Switch"]),
      m("Bronzor","bronzor",["steel","psychic"],"Eviolite","Levitate","Bold",["Stealth Rock","Psychic","Toxic","Recover"]),
      m("Snover","snover",["grass","ice"],"Life Orb","Snow Warning","Modest",["Blizzard","Energy Ball","Ice Shard","Hidden Power Fire"]),
    ],
  },
  {
    id: 13, name: "CroCune Stall", format: 2,
    author: { id: 12, name: "wallmaster" },
    createdAt: "2026-04-29", likes: 156, liked: false,
    description: "Calm Mind Suicune as a win condition behind a defensive Spikes core. Patient and oppressive.",
    members: [
      m("Suicune","suicune",["water"],"Leftovers","Pressure","Bold",["Calm Mind","Surf","Rest","Sleep Talk"]),
      m("Skarmory","skarmory",["steel","flying"],"Shed Shell","Keen Eye","Impish",["Spikes","Roost","Whirlwind","Brave Bird"]),
      m("Blissey","blissey",["normal"],"Leftovers","Natural Cure","Calm",["Seismic Toss","Softboiled","Toxic","Aromatherapy"]),
      m("Dusknoir","dusknoir",["ghost"],"Leftovers","Pressure","Impish",["Will-O-Wisp","Shadow Sneak","Pain Split","Ice Punch"]),
      m("Celebi","celebi",["grass","psychic"],"Leftovers","Natural Cure","Calm",["Perish Song","Recover","Grass Knot","Thunder Wave"]),
      m("Tentacruel","tentacruel",["water","poison"],"Black Sludge","Liquid Ooze","Calm",["Rapid Spin","Toxic Spikes","Scald","Protect"]),
    ],
  },
  {
    id: 14, name: "Mence + Magneton Offense", format: 2,
    author: { id: 14, name: "intimidator" },
    createdAt: "2026-06-09", likes: 73, liked: false,
    description: "Magnezone traps steels so Salamence's Outrage runs unchecked. Heatran rounds out the core.",
    members: [
      m("Salamence","salamence",["dragon","flying"],"Choice Band","Intimidate","Adamant",["Outrage","Earthquake","Stone Edge","Fire Fang"]),
      m("Magnezone","magnezone",["electric","steel"],"Choice Scarf","Magnet Pull","Timid",["Thunderbolt","Hidden Power Fire","Flash Cannon","Explosion"]),
      m("Heatran","heatran",["fire","steel"],"Leftovers","Flash Fire","Calm",["Stealth Rock","Lava Plume","Earth Power","Roar"]),
      m("Starmie","starmie",["water","psychic"],"Life Orb","Natural Cure","Timid",["Hydro Pump","Thunderbolt","Ice Beam","Rapid Spin"]),
      m("Jirachi","jirachi",["steel","psychic"],"Choice Scarf","Serene Grace","Jolly",["Iron Head","U-turn","Ice Punch","Trick"]),
      m("Breloom","breloom",["grass","fighting"],"Toxic Orb","Poison Heal","Adamant",["Spore","Seed Bomb","Mach Punch","Substitute"]),
    ],
  },
];

export const MOCK_TEAMS: BrowserTeam[] = RAW_TEAMS.map((team) => ({
  ...team,
  members: team.members.map(resolve),
}));
