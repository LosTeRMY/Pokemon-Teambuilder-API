// One-time/occasionally-rerun tool: slices Pokémon Showdown's item icon
// spritesheet into individual PNGs under public/sprites/items/<slug>.png,
// mirroring the Pokémon sprite convention (public/sprites/gen4/<slug>.png).
// Run with: npm run fetch:item-sprites
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const ITEMS_JSON_PATH = path.join(REPO_ROOT, "data/items.json");
const OUT_DIR = path.join(__dirname, "../public/sprites/items");

const ITEMS_TS_URL = "https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/items.ts";
const SHEET_URL = "https://play.pokemonshowdown.com/sprites/itemicons-sheet.png";

const ICON_SIZE = 24;
const SHEET_COLS = 16;
const CONCURRENCY = 8;

// Mirrors client/lib/lookups.ts#slug — keep in sync.
const slug = (name) =>
  name.toLowerCase().replace(/['’.:]/g, "").replace(/\s+/g, "").replace(/[^a-z0-9-]/g, "");

/* Parses data/items.ts as plain text — never executes it (it's fetched,
 * untrusted code; we only need two fields out of it). Tracks brace depth so
 * nested objects (fling, megaStone, etc.) inside an item's block don't get
 * mistaken for the start of the next item. */
function parseSpritenums(itemsTsSource) {
  const lines = itemsTsSource.split("\n");
  const bySlug = new Map();

  let depth = 0;
  let inBlock = false;
  let curName = null;
  let curSpritenum = null;

  for (const line of lines) {
    const opens = (line.match(/\{/g) || []).length;
    const closes = (line.match(/\}/g) || []).length;

    if (!inBlock) {
      if (depth === 1 && /^\t\w+:\s*\{\s*$/.test(line)) {
        inBlock = true;
        curName = null;
        curSpritenum = null;
      }
    } else {
      if (curName === null) {
        const nameMatch = line.match(/name:\s*"([^"]+)"/);
        if (nameMatch) curName = nameMatch[1];
      }
      if (curSpritenum === null) {
        const spriteMatch = line.match(/spritenum:\s*(\d+)/);
        if (spriteMatch) curSpritenum = parseInt(spriteMatch[1], 10);
      }
    }

    depth += opens - closes;

    if (inBlock && depth === 1) {
      if (curName && curSpritenum !== null) bySlug.set(slug(curName), curSpritenum);
      inBlock = false;
    }
  }

  return bySlug;
}

async function main() {
  const items = JSON.parse(await readFile(ITEMS_JSON_PATH, "utf8"));
  await mkdir(OUT_DIR, { recursive: true });

  console.log("Fetching item spritenum data…");
  const itemsTsRes = await fetch(ITEMS_TS_URL);
  if (!itemsTsRes.ok) throw new Error(`Failed to fetch items.ts: ${itemsTsRes.status}`);
  const spritenumBySlug = parseSpritenums(await itemsTsRes.text());
  console.log(`Parsed ${spritenumBySlug.size} spritenum entries.`);

  console.log("Fetching item icon spritesheet…");
  const sheetRes = await fetch(SHEET_URL);
  if (!sheetRes.ok) throw new Error(`Failed to fetch spritesheet: ${sheetRes.status}`);
  const sheetBuffer = Buffer.from(await sheetRes.arrayBuffer());

  const succeeded = [];
  const skipped = [];
  const failed = [];

  async function processItem(item) {
    const itemSlug = slug(item.name);
    const outPath = path.join(OUT_DIR, `${itemSlug}.png`);

    if (existsSync(outPath)) {
      skipped.push(item.name);
      return;
    }

    const spritenum = spritenumBySlug.get(itemSlug);
    if (spritenum === undefined) {
      failed.push(`${item.name} (${itemSlug}) — no spritenum match`);
      return;
    }

    const col = spritenum % SHEET_COLS;
    const row = Math.floor(spritenum / SHEET_COLS);

    try {
      const cropped = await sharp(sheetBuffer)
        .extract({ left: col * ICON_SIZE, top: row * ICON_SIZE, width: ICON_SIZE, height: ICON_SIZE })
        .toBuffer();
      await writeFile(outPath, cropped);
      succeeded.push(item.name);
    } catch (err) {
      failed.push(`${item.name} (${itemSlug}) — ${err.message}`);
    }
  }

  // Simple fixed-size worker pool — no need for a queue library for 209 items.
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const item = items[cursor++];
      await processItem(item);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`\nDone. succeeded=${succeeded.length} skipped=${skipped.length} failed=${failed.length}`);
  if (failed.length) {
    console.log("\nFailed items (left on the colored-letter fallback):");
    failed.forEach((f) => console.log(`  - ${f}`));
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
