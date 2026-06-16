import { readFileSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const raw    = readFileSync(join(tmpdir(), "learnsets_ps.ts"), "utf8");
const moves  = JSON.parse(readFileSync("./client/data/moves.json", "utf8"));
const nameToId = Object.fromEntries(
  moves.map(m => [m.name.toLowerCase().replace(/[^a-z0-9]/g, ""), m.id])
);

const TARGETS = ["Jigglypuff", "Dratini", "Azelf", "Dialga", "Palkia", "Cresselia"];
const result = {};
const notInProject = {};

for (const name of TARGETS) {
  const start = raw.indexOf(name.toLowerCase() + ": {");
  if (start === -1) { console.error("NOT FOUND:", name); continue; }

  // Walk braces to find end of block
  let depth = 0, i = start, blockEnd = -1;
  while (i < raw.length) {
    if (raw[i] === "{") depth++;
    else if (raw[i] === "}") { depth--; if (depth === 0) { blockEnd = i; break; } }
    i++;
  }
  const block = raw.slice(start, blockEnd + 1);

  // Find learnset sub-block
  const lsIdx = block.indexOf("learnset: {");
  if (lsIdx === -1) { console.error("No learnset block for", name); continue; }
  let lsDepth = 0, j = lsIdx, lsEnd = -1;
  while (j < block.length) {
    if (block[j] === "{") lsDepth++;
    else if (block[j] === "}") { lsDepth--; if (lsDepth === 0) { lsEnd = j; break; } }
    j++;
  }
  const lsBlock = block.slice(lsIdx, lsEnd + 1);

  // Extract each move entry
  const gen4MoveIds = [];
  const missing = [];
  const re = /(\w+):\s*\[([^\]]+)\]/g;
  let m;
  while ((m = re.exec(lsBlock)) !== null) {
    const [, moveName, sources] = m;
    // Any source that starts with '4'
    if (!sources.includes("'4") && !sources.includes('"4')) continue;
    const key = moveName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const id  = nameToId[key];
    if (id !== undefined) {
      gen4MoveIds.push(id);
    } else {
      missing.push(moveName);
    }
  }

  gen4MoveIds.sort((a, b) => a - b);
  result[name] = gen4MoveIds;
  notInProject[name] = missing;
  console.log(`${name}: ${gen4MoveIds.length} moves mapped, ${missing.length} not in project: ${missing.join(", ") || "none"}`);
}

writeFileSync("./gen4_missing_learnsets.json", JSON.stringify(result, null, 2));
console.log("\nWritten to gen4_missing_learnsets.json");
