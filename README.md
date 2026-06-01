# SocialPulse

Sister product to TokScript. A Chrome extension that captures Facebook posts as you scroll a profile page — same auth as TokScript, separate brand.

## Status

Phase 1 (Chrome extension) — initial scaffold complete. Not yet tested against live Facebook DOM. Selectors are centralized in `src/lib/facebook/scrape.ts` and will likely need tuning on first test against real profiles.

## Setup

```bash
cd /Users/bob/Documents/socialpulse
npm install
npm run icons     # one-time: render PNG icons from src/assets/icon.svg
npm run build     # produces dist/
```

## Load the extension

1. Open `chrome://extensions` in Chrome.
2. Toggle **Developer mode** (top-right).
3. Click **Load unpacked** and pick `/Users/bob/Documents/socialpulse/dist`.
4. Open any Facebook profile, e.g. `https://www.facebook.com/zuck`. The bubble should appear mid-right.
5. Scroll. Posts should accumulate in the panel. Open the panel by clicking the bubble.

## Dev mode

```bash
npm run dev
```

Then reload the extension in `chrome://extensions` after each rebuild. HMR works for the panel UI but not for content-script bootstrapping logic — when in doubt, full reload.

## Project structure

```
src/
├── assets/                # icon source + generated PNGs
├── background/            # service worker (auth/sync stubs)
├── components/            # React UI (Bubble, Panel, PostCard, ...)
├── content/               # content script entry — Shadow DOM mount
├── lib/
│   ├── auth.ts            # TokScript session interface (stubbed)
│   ├── sync.ts            # backend sync interface (stubbed)
│   ├── storage.ts         # chrome.storage wrapper
│   └── facebook/
│       ├── detect.ts      # profile URL/page detection
│       ├── scrape.ts      # post DOM extraction (centralized selectors)
│       ├── observer.ts    # auto-scrape on scroll
│       └── types.ts
├── styles/                # design tokens + panel CSS (injected into Shadow DOM)
└── manifest.config.ts     # MV3 manifest via @crxjs
```

## Design system

Tokens live in [src/styles/theme.css](src/styles/theme.css). Hand-crafted CSS rather than Tailwind because the panel runs inside a Shadow DOM where Tailwind v4's preflight + utility injection doesn't compose cleanly. The token palette is the spec from the build prompt; if the brand evolves, change tokens in one file.

## What's stubbed

- **TokScript auth** — [src/lib/auth.ts](src/lib/auth.ts) reads/writes a `Session` from `chrome.storage`, but the actual sign-in flow (open TokScript auth URL, capture token on redirect) is a TODO in [src/background/index.ts](src/background/index.ts). Until wired, signed-out users still capture posts locally; sync becomes a no-op.
- **Backend sync** — [src/lib/sync.ts](src/lib/sync.ts) has the POST shape but the network call is commented out pending endpoint confirmation. Posts sit in `chrome.storage.local`.

Both are designed so the rest of the codebase doesn't change when the real surfaces land.

## What needs validation against live Facebook

The DOM scraping in [src/lib/facebook/scrape.ts](src/lib/facebook/scrape.ts) uses structural selectors (role, aria-label, href patterns) that are more durable than class names — but Facebook's DOM still drifts. Expect to tune:

- `extractPostId` — Facebook may surface new URL shapes.
- `readStats` — reactions/comments/shares text varies by locale and post type.
- `detectType` — slideshow vs. carousel detection is heuristic.
- `readTimestamp` — locale-dependent aria-label parsing.

Test pass: load on a high-volume creator, a low-volume profile, and a business page. Watch the console for parse failures.

## Out of scope (per build prompt)

- No media download / export.
- No folders or collections (Phase 2).
- No discovery feed.
- No bulk capture across non-profile pages.
- Bubble must never appear in Facebook's bottom-right (Messenger collision) — bubble is fixed mid-right by design.

## Phase 2

Dashboard work (Library grid, filters, analytics, folders) starts after Phase 1 is stable. Folders are flagged ⚠️ — Michael said out of MVP scope; confirm before building.
