// Generates PNG icons from src/assets/icon.svg at the sizes the manifest expects.
// Run once after `npm install`: `npm run icons`.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const src = resolve(root, "src/assets/icon.svg");
const sizes = [16, 32, 48, 128];

const svg = await readFile(src);
for (const size of sizes) {
  const out = resolve(root, `src/assets/icon-${size}.png`);
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log(`wrote ${out}`);
}
console.log("done.");
