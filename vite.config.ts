import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./src/manifest.config.ts";

// `mode === "preview"` builds the standalone design-preview HTML
// (index.html + src/preview/index.tsx) as a regular static site for GitHub
// Pages. The CRX plugin is skipped in that mode so it doesn't try to emit a
// manifest.json / service worker.
export default defineConfig(({ mode }) => {
  const isPreview = mode === "preview";
  return {
    base: isPreview ? "/socialpulse/" : "/",
    plugins: isPreview ? [react()] : [react(), crx({ manifest })],
    server: { port: 5173, strictPort: true, hmr: { port: 5173 } },
    build: {
      sourcemap: true,
      target: "esnext",
      outDir: isPreview ? "dist-preview" : "dist",
    },
  };
});
