import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Bubble } from "../components/Bubble";
import { Panel } from "../components/Panel";
import { getSession, onSessionChanged, setSession } from "../lib/auth";
import type { FacebookPost, ProfileContext } from "../lib/facebook/types";

import themeCss from "../styles/theme.css?raw";
import panelCss from "../styles/panel.css?raw";
import "@fontsource/mona-sans/400.css";
import "@fontsource/mona-sans/500.css";
import "@fontsource/mona-sans/600.css";
import "@fontsource/mona-sans/700.css";
import "@fontsource/mona-sans/800.css";

/* Standalone design preview — runs at npm run dev on localhost.
 *
 * Mirrors the content script's Shadow DOM mounting so the panel renders
 * identically to how it will inside Facebook. Auto-runs a "live capture"
 * loop: posts drip in one by one with the capturing pill flashing and the
 * bubble glow flaring on each capture, then a brief pause and the cycle
 * restarts. This makes the page actually demonstrate the product.
 */

const PROFILE: ProfileContext = {
  username: "kendall.cooks",
  displayName: "Kendall Cooks",
  url: "https://www.facebook.com/kendall.cooks",
};

const MOCK_POSTS: FacebookPost[] = [
  {
    id: "pfbid1",
    url: "https://www.facebook.com/kendall.cooks/posts/pfbid1",
    profileId: PROFILE.username,
    profileUsername: PROFILE.username,
    type: "video",
    caption: "Three minutes, one pan, zero excuses. The garlic-butter shrimp that keeps showing up in my saved folder for a reason — try it tonight.",
    thumbnailUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=720&auto=format&fit=crop",
    videoUrl: null,
    stats: { likes: 12400, comments: 318, shares: 1240 },
    postedAt: new Date("2026-05-04T20:42:00").toISOString(),
    capturedAt: Date.now() - 1000 * 60 * 60 * 12,
  },
  {
    id: "pfbid2",
    url: "https://www.facebook.com/kendall.cooks/posts/pfbid2",
    profileId: PROFILE.username,
    profileUsername: PROFILE.username,
    type: "carousel",
    caption: "Five pantry swaps that quietly upgrade every weeknight dinner. Swipe through — number 3 changed how I roast vegetables forever.",
    thumbnailUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=720&auto=format&fit=crop",
    videoUrl: null,
    stats: { likes: 8900, comments: 211, shares: 740 },
    postedAt: new Date("2026-05-02T14:10:00").toISOString(),
    capturedAt: Date.now() - 1000 * 60 * 60 * 36,
  },
  {
    id: "pfbid3",
    url: "https://www.facebook.com/kendall.cooks/posts/pfbid3",
    profileId: PROFILE.username,
    profileUsername: PROFILE.username,
    type: "photo",
    caption: "Sunday baking light hits different.",
    thumbnailUrl: "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=720&auto=format&fit=crop",
    videoUrl: null,
    stats: { likes: 4200, comments: 86, shares: 91 },
    postedAt: new Date("2026-04-28T09:15:00").toISOString(),
    capturedAt: Date.now() - 1000 * 60 * 60 * 96,
  },
  {
    id: "pfbid4",
    url: "https://www.facebook.com/kendall.cooks/posts/pfbid4",
    profileId: PROFILE.username,
    profileUsername: PROFILE.username,
    type: "slideshow",
    caption: "What I actually keep in my fridge in the middle of a busy week — no styled propaganda, just real life.",
    thumbnailUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=720&auto=format&fit=crop",
    videoUrl: null,
    stats: { likes: 2710, comments: 124, shares: 56 },
    postedAt: new Date("2026-04-25T18:55:00").toISOString(),
    capturedAt: Date.now() - 1000 * 60 * 60 * 130,
  },
  {
    id: "pfbid5",
    url: "https://www.facebook.com/kendall.cooks/posts/pfbid5",
    profileId: PROFILE.username,
    profileUsername: PROFILE.username,
    type: "link",
    caption: "I wrote up the full method for my make-ahead breakfast jars on the blog — link in the post.",
    thumbnailUrl: "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=720&auto=format&fit=crop",
    videoUrl: null,
    stats: { likes: 980, comments: 42, shares: 18 },
    postedAt: new Date("2026-04-21T11:30:00").toISOString(),
    capturedAt: Date.now() - 1000 * 60 * 60 * 160,
  },
  {
    id: "pfbid6",
    url: "https://www.facebook.com/kendall.cooks/posts/pfbid6",
    profileId: PROFILE.username,
    profileUsername: PROFILE.username,
    type: "video",
    caption: "Crispiest tofu, no cornstarch, no fryer. Save this one.",
    thumbnailUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=720&auto=format&fit=crop",
    videoUrl: null,
    stats: { likes: 33200, comments: 612, shares: 4100 },
    postedAt: new Date("2026-04-18T19:00:00").toISOString(),
    capturedAt: Date.now() - 1000 * 60 * 60 * 200,
  },
];

type PreviewMode = "live" | "static" | "empty-no-profile" | "empty-no-posts";

type StatJitter = Record<string, { likes: number; comments: number; shares: number }>;

function jitterStat(base: number): number {
  const swing = Math.max(1, Math.floor(base * (0.04 + Math.random() * 0.08)));
  return Math.random() > 0.5 ? base + swing : Math.max(0, base - swing);
}

function buildJitter(posts: FacebookPost[]): StatJitter {
  return Object.fromEntries(
    posts.map((p) => [
      p.id,
      { likes: jitterStat(p.stats.likes), comments: jitterStat(p.stats.comments), shares: jitterStat(p.stats.shares) },
    ]),
  );
}

function App({ host }: { host: HTMLElement }) {
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<PreviewMode>("live");
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [statJitter, setStatJitter] = useState<StatJitter>({});
  const [capturing, setCapturing] = useState(false);
  const [bubbleFlash, setBubbleFlash] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Wire signedIn to the real session so the preview's gear icon appears once
  // the auth flow's setSession() lands (it falls back to localStorage here).
  useEffect(() => {
    void getSession().then((s) => setSignedIn(!!s));
    return onSessionChanged((s) => setSignedIn(!!s));
  }, []);

  // The dev toolbar's Signed in/out chips also need to manipulate the real
  // session so the AuthFlow re-shows correctly when toggling back to signed-out.
  const toggleSignedIn = async (next: boolean) => {
    if (next) {
      await setSession({ userId: "preview-user", email: "preview@socialpulse.dev", accessToken: "preview" });
    } else {
      await setSession(null);
    }
  };

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "light") host.setAttribute("data-theme", "light");
    else host.removeAttribute("data-theme");
  }

  // Randomize stats every 1.2 s — seeded from current posts so new drip
  // arrivals get jitter applied immediately on next tick.
  useEffect(() => {
    const id = window.setInterval(() => {
      setPosts((cur) => {
        setStatJitter(buildJitter(cur));
        return cur;
      });
    }, 1200);
    return () => window.clearInterval(id);
  }, []);

  const displayPosts = posts.map((p) => {
    const j = statJitter[p.id];
    if (!j) return p;
    return { ...p, stats: { likes: j.likes, comments: j.comments, shares: j.shares } };
  });

  const captureTimer = useRef<number | null>(null);
  const stopTimer = useRef<number | null>(null);
  const flashTimer = useRef<number | null>(null);

  /* The live loop. Drips posts in one at a time with brief pauses, flashing
   * the capturing pill and bubble glow as each post lands. After the last
   * post, holds for a beat then resets and starts over. */
  useEffect(() => {
    function clearAll() {
      if (captureTimer.current) window.clearTimeout(captureTimer.current);
      if (stopTimer.current) window.clearTimeout(stopTimer.current);
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
      captureTimer.current = stopTimer.current = flashTimer.current = null;
    }

    if (mode !== "live") {
      clearAll();
      if (mode === "static") setPosts(MOCK_POSTS);
      if (mode === "empty-no-profile" || mode === "empty-no-posts") setPosts([]);
      setCapturing(false);
      return;
    }

    // Start with the first 2 posts already captured so motion is visible
    // immediately on page load — no dead first beat.
    const SEED = 2;
    setPosts(MOCK_POSTS.slice(0, SEED));
    setCapturing(true);

    let i = SEED;
    const dripNext = () => {
      if (i >= MOCK_POSTS.length) {
        // Hold a beat with capturing off, then reset and loop.
        setCapturing(false);
        stopTimer.current = window.setTimeout(() => {
          setPosts(MOCK_POSTS.slice(0, SEED));
          setCapturing(true);
          i = SEED;
          captureTimer.current = window.setTimeout(dripNext, 600);
        }, 3500);
        return;
      }

      // Snapshot the post BEFORE incrementing — the setState callback runs
      // async, so closing over `i` directly reads a stale-by-the-time-it-runs
      // index and pushes undefined into posts.
      const next = MOCK_POSTS[i];
      i += 1;

      setCapturing(true);
      setBubbleFlash(true);
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setBubbleFlash(false), 600);

      setPosts((cur) => [...cur, next]);

      // Drip cadence: 700ms between captures.
      captureTimer.current = window.setTimeout(dripNext, 700);
    };

    captureTimer.current = window.setTimeout(dripNext, 600);
    return clearAll;
  }, [mode]);

  const profile: ProfileContext | null = mode === "empty-no-profile" ? null : PROFILE;

  return (
    <>
      <div className="preview-controls">
        <strong>SocialPulse — design preview</strong>
        <span className="preview-hint">
          {mode === "live"
            ? "Live capture loop running. Watch posts drip in, the capturing pill flash, and the bubble glow on each catch."
            : mode === "static"
            ? "All posts loaded. Hover cards, click filters/sort, expand a post."
            : mode === "empty-no-profile"
            ? "Empty state when no Facebook profile is detected."
            : "Empty state when on a profile but no posts captured yet."}
        </span>
        <div className="preview-buttons">
          <button data-active={mode === "live"} onClick={() => setMode("live")}>Live capture</button>
          <button data-active={mode === "static"} onClick={() => setMode("static")}>All posts</button>
          <button data-active={mode === "empty-no-profile"} onClick={() => setMode("empty-no-profile")}>No profile</button>
          <button data-active={mode === "empty-no-posts"} onClick={() => setMode("empty-no-posts")}>No posts</button>
        </div>
        <div className="preview-buttons">
          <button data-active={!signedIn} onClick={() => toggleSignedIn(false)}>Signed out</button>
          <button data-active={signedIn} onClick={() => toggleSignedIn(true)}>Signed in</button>
          <button onClick={() => setOpen((v) => !v)}>{open ? "Close panel" : "Open panel"}</button>
          <button
            onClick={async () => {
              localStorage.removeItem("socialpulse.session.v1");
              localStorage.removeItem("socialpulse.onboarding.v1");
              await setSession(null);
              setOpen(true);
            }}
            title="Clear stored session + onboarding so the auth flow restarts"
          >
            Reset onboarding
          </button>
        </div>
      </div>

      <Bubble hidden={open} flash={bubbleFlash} onClick={() => setOpen(true)} />
      <Panel
        open={open}
        onClose={() => setOpen(false)}
        profile={profile}
        posts={displayPosts}
        capturing={capturing}
        signedIn={signedIn}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </>
  );
}

function mount() {
  // HMR sometimes re-runs this module without a full reload; nuke any prior
  // mount so we never have stacked Shadow DOMs running stale React trees.
  document.querySelectorAll("#__socialpulse_preview__").forEach((n) => n.remove());

  const host = document.createElement("div");
  host.id = "__socialpulse_preview__";
  host.style.cssText = "all: initial; position: fixed; inset: 0; pointer-events: none; z-index: 2147483640;";
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = themeCss + "\n" + panelCss + "\n" + previewControlsCss;
  shadow.appendChild(style);

  const root = document.createElement("div");
  root.className = "panel-root";
  root.style.cssText = "pointer-events: none;";
  shadow.appendChild(root);

  document.body.appendChild(host);
  createRoot(root).render(<App host={host} />);
}

// Force a clean full reload on any HMR — Shadow DOM + module-level mount
// don't compose well with partial updates.
if (import.meta.hot) import.meta.hot.accept(() => location.reload());

const previewControlsCss = `
.preview-controls {
  position: fixed;
  top: 16px;
  left: 16px;
  background: var(--surface-card);
  color: var(--ink-primary);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card-hover);
  padding: 14px 16px;
  font-family: var(--font-ui);
  font-size: 13px;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 320px;
}
.preview-controls strong {
  font-family: var(--font-display);
  font-size: 14px;
  letter-spacing: -0.005em;
}
.preview-hint {
  font-size: 12px;
  color: var(--ink-secondary);
  line-height: 1.45;
}
.preview-buttons { display: flex; flex-wrap: wrap; gap: 6px; }
.preview-buttons button {
  background: var(--surface-soft);
  color: var(--ink-secondary);
  border: 1px solid var(--border-hairline);
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: background 180ms, color 180ms, border-color 180ms;
}
.preview-buttons button:hover { background: var(--primary-wash); color: var(--primary-deep); border-color: transparent; }
.preview-buttons button[data-active="true"] {
  background: var(--primary-wash);
  color: var(--primary-deep);
  border-color: transparent;
}
`;

mount();
