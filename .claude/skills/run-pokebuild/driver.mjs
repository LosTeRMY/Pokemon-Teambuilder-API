// driver.mjs — chromium-cli wasn't available in this container, so this is a
// minimal stand-in with the same vocabulary (nav/wait-for/click/fill/press/
// screenshot/console-errors), plus two helpers specific to this app's real
// auth flow (login/register). Pipe newline-delimited commands to stdin; see
// SKILL.md for the exact invocation and command reference.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SHOTS_DIR = path.join(__dirname, "screenshots");
mkdirSync(SHOTS_DIR, { recursive: true });

const errors = [];

function resolveLocator(page, target) {
  if (target.startsWith("text=")) return page.locator(`text=${target.slice(5)}`).first();
  if (target.startsWith("button:")) return page.locator(target).first();
  return page.locator(target).first();
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errors.push(`[console.error] ${m.text()}`); });

  const rl = readline.createInterface({ input: process.stdin });
  let shotCount = 0;

  for await (const raw of rl) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [cmd, ...rest] = line.split(" ");
    const arg = rest.join(" ");

    try {
      switch (cmd) {
        case "nav":
          await page.goto(arg, { waitUntil: "networkidle" });
          console.log("nav ->", page.url());
          break;
        case "wait-for":
          await page.waitForSelector(resolveLocatorSelector(arg), { timeout: 15000 });
          console.log("wait-for matched:", arg);
          break;
        case "wait-url-not":
          await page.waitForURL((u) => !u.pathname.includes(arg), { timeout: 15000 });
          console.log("wait-url-not ok, now at", page.url());
          break;
        case "click":
          await resolveLocator(page, arg).click();
          console.log("clicked:", arg);
          break;
        case "fill": {
          const [sel, ...valParts] = rest;
          await page.locator(sel).first().fill(valParts.join(" "));
          console.log("filled:", sel);
          break;
        }
        case "press":
          await page.keyboard.press(arg);
          console.log("pressed:", arg);
          break;
        case "wait":
          await page.waitForTimeout(Number(arg) || 500);
          break;
        case "screenshot": {
          const name = arg || `shot-${++shotCount}`;
          const file = path.join(SHOTS_DIR, `${name}.png`);
          await page.screenshot({ path: file, fullPage: true });
          console.log("screenshot:", file);
          break;
        }
        case "screenshot-element": {
          const file = path.join(SHOTS_DIR, `${arg.replace(/[^a-z0-9-]/gi, "_")}.png`);
          await resolveLocator(page, arg).screenshot({ path: file });
          console.log("screenshot-element:", file);
          break;
        }
        case "console-errors":
          console.log(errors.length ? errors.join("\n") : "(no console/page errors so far)");
          break;
        case "login": {
          const [email, password] = rest;
          await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
          await page.locator("#email").fill(email);
          await page.locator("#password").fill(password);
          await page.locator('button[type="submit"]').first().click();
          await page.waitForURL((u) => !u.pathname.includes("login"), { timeout: 15000 });
          console.log("login ok, now at", page.url());
          break;
        }
        case "register": {
          const [username, email, password] = rest;
          await page.goto("http://localhost:3000/register", { waitUntil: "networkidle" });
          await page.locator("#username").fill(username);
          await page.locator("#email").fill(email);
          await page.locator("#password").fill(password);
          await page.locator('button[type="submit"]').first().click();
          // Real round trip (bcrypt + register-then-login) — takes ~8s, not instant.
          await page.waitForURL((u) => !u.pathname.includes("register"), { timeout: 20000 });
          console.log("register ok, now at", page.url());
          break;
        }
        case "eval":
          console.log(await page.evaluate(new Function(`return (${arg})`)()));
          break;
        case "quit":
        case "end":
          await browser.close();
          process.exit(0);
        default:
          console.log("unknown command:", cmd);
      }
    } catch (err) {
      console.log(`ERROR on "${line}":`, err.message);
    }
  }

  await browser.close();
}

// wait-for accepts either a CSS selector or "text=..."
function resolveLocatorSelector(arg) {
  return arg;
}

main();
