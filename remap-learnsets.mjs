import { readFileSync, writeFileSync } from "fs";

const POKE_PATH  = "C:/Users/ttran/Desktop/Pokemon-Teambuilder-API/client/data/pokemons.json";
const LEARN_PATH = "C:/Users/ttran/Desktop/Pokemon-Teambuilder-API/client/data/learnsets.json";

const ALTERNATE_FORMS = new Set([
  "Deoxys-Attack", "Deoxys-Defense", "Deoxys-Speed",
  "Wormadam-Sandy", "Wormadam-Trash",
  "Rotom-Fan", "Rotom-Frost", "Rotom-Heat", "Rotom-Mow", "Rotom-Wash",
  "Giratina-Origin", "Shaymin-Sky",
  "arceus-bug", "arceus-dark", "arceus-dragon", "arceus-electric",
  "arceus-fighting", "arceus-fire", "arceus-flying", "arceus-ghost",
  "arceus-grass", "arceus-ground", "arceus-ice", "arceus-poison",
  "arceus-psychic", "arceus-rock", "arceus-steel", "arceus-water",
]);

const pokemons  = JSON.parse(readFileSync(POKE_PATH,  "utf8"));
const learnsets = JSON.parse(readFileSync(LEARN_PATH, "utf8"));

// dexNum → current id, base forms only
const dexToId = new Map();
for (const p of pokemons) {
  if (!ALTERNATE_FORMS.has(p.name) && p.dexNum != null) {
    if (!dexToId.has(p.dexNum)) dexToId.set(p.dexNum, p.id);
  }
}

let updated = 0;
const skipped = [];

for (const entry of learnsets) {
  const newId = dexToId.get(entry.pokemonId);
  if (newId !== undefined) {
    entry.pokemonId = newId;
    updated++;
  } else {
    skipped.push(entry.pokemonId);
  }
}

writeFileSync(LEARN_PATH, JSON.stringify(learnsets, null, 2));
console.log(`Done — ${updated} learnsets remapped.`);
if (skipped.length) console.warn("No pokemon found for old pokemonIds:", skipped);
