import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "../package.json" with { type: "json" };

export default defineManifest({
  manifest_version: 3,
  name: "SocialPulse",
  description: "Grab what's working on Facebook. Capture posts from any profile as you scroll.",
  version: pkg.version,
  icons: {
    "16": "src/assets/icon-16.png",
    "32": "src/assets/icon-32.png",
    "48": "src/assets/icon-48.png",
    "128": "src/assets/icon-128.png",
  },
  action: {
    default_title: "SocialPulse",
    default_icon: {
      "16": "src/assets/icon-16.png",
      "32": "src/assets/icon-32.png",
    },
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: [
        "https://www.facebook.com/*",
        "https://m.facebook.com/*",
        "https://web.facebook.com/*",
      ],
      js: ["src/content/index.tsx"],
      run_at: "document_idle",
    },
  ],
  permissions: ["storage", "activeTab"],
  host_permissions: [
    "https://www.facebook.com/*",
    "https://*.facebook.com/*",
  ],
  web_accessible_resources: [
    {
      resources: ["src/assets/*"],
      matches: ["https://*.facebook.com/*"],
    },
  ],
});
