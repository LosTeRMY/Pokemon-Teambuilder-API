import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dir, '../public/sprites/gen4');
const BASE_URL = 'https://play.pokemonshowdown.com/sprites/gen4/';

mkdirSync(OUT_DIR, { recursive: true });

const slug = (name) =>
  name.toLowerCase().replace(/[''.:]/g, '').replace(/\s+/g, '').replace(/[^a-z0-9-]/g, '');

// Load all pokemon names from data
const pokemons = JSON.parse(readFileSync(join(__dir, '../../data/pokemons.json'), 'utf8'));

// Build slug list from pokemon names
const slugs = new Set(pokemons.map((p) => slug(p.name)));

// Extra alternate-form slugs used in mock data but not in the base pokemon list
const extras = [
  'rotom-wash', 'rotom-heat', 'rotom-frost', 'rotom-fan', 'rotom-mow',
  'giratina-origin', 'deoxys-attack', 'deoxys-defense', 'deoxys-speed',
  'shaymin-sky', 'wormadam-sandy', 'wormadam-trash',
];
extras.forEach((s) => slugs.add(s));

function download(url, dest) {
  return new Promise((resolve) => {
    if (existsSync(dest)) { resolve('skip'); return; }
    const file = writeFileSync; // placeholder — overwritten below
    https.get(url, (res) => {
      if (res.statusCode !== 200) { res.resume(); resolve('miss'); return; }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => { writeFileSync(dest, Buffer.concat(chunks)); resolve('ok'); });
    }).on('error', () => resolve('err'));
  });
}

let ok = 0, miss = 0, skip = 0;
const total = slugs.size;
let i = 0;

for (const s of slugs) {
  i++;
  const url = BASE_URL + s + '.png';
  const dest = join(OUT_DIR, s + '.png');
  const result = await download(url, dest);
  if (result === 'ok')   ok++;
  if (result === 'miss') miss++;
  if (result === 'skip') skip++;
  if (i % 50 === 0 || i === total) process.stdout.write(`\r${i}/${total}  ✓${ok}  miss:${miss}  skip:${skip}   `);
}

console.log(`\nDone. ${ok} downloaded, ${miss} not found (404), ${skip} already existed.`);
