// Headless screenshot of the design preview. Reuses the playwright copy already
// installed in the tokscriptv3-dashboard project so we don't bloat socialpulse's
// devDeps for one-off visual checks.
//
// Usage:
//   node screenshot.mjs                          → full page, default url
//   node screenshot.mjs <url>                    → full page, custom url
//   node screenshot.mjs <url> <label>            → full page with label suffix
//   node screenshot.mjs <url> <label> --panel    → crop to the panel only

import { chromium } from "/Users/bob/Documents/tokscript/tokscriptv3-dashboard/node_modules/playwright/index.mjs";
import { mkdirSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "temporary screenshots");
mkdirSync(outDir, { recursive: true });

const url = process.argv[2] || "http://localhost:5173";
const label = process.argv[3];
const panelOnly = process.argv.includes("--panel");
const waitArg = process.argv.find((a) => a.startsWith("--wait="));
const waitMs = waitArg ? parseInt(waitArg.split("=")[1], 10) : 600;

const existing = readdirSync(outDir).filter((f) => f.startsWith("screenshot-"));
const next = existing.length + 1;
const baseName = panelOnly
  ? `screenshot-${next}-${label || "panel"}-cropped`
  : (label ? `screenshot-${next}-${label}` : `screenshot-${next}`);
const out = resolve(outDir, `${baseName}.png`);

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: panelOnly ? 480 : 1440, height: 900 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(waitMs);

if (panelOnly) {
  // Hide the preview-controls overlay so the screenshot is clean.
  await page.evaluate(() => {
    const root = document.getElementById("__socialpulse_preview__");
    const ctrl = root?.shadowRoot?.querySelector(".preview-controls");
    if (ctrl) ctrl.style.display = "none";
  });
}

await page.screenshot({ path: out, fullPage: !panelOnly });
await browser.close();
console.log(out);
