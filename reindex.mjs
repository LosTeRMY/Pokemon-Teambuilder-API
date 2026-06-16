import { readFileSync, writeFileSync } from "fs";

const POKE_PATH   = "./data/pokemons.json";
const POKE_CLIENT = "./client/data/pokemons.json";

const pokemons = JSON.parse(readFileSync(POKE_CLIENT, "utf8"));

pokemons.forEach((p, i) => { p.id = i + 1; });

const pokeJson = JSON.stringify(pokemons, null, 2);
writeFileSync(POKE_PATH,   pokeJson);
writeFileSync(POKE_CLIENT, pokeJson);

console.log(`Done — ${pokemons.length} Pokémon reindexed.`);
