import { createRoot } from "react-dom/client";
import { useEffect, useRef, useState } from "react";
import { Bubble } from "../components/Bubble";
import { Panel } from "../components/Panel";
import { detectProfileFromUrl, looksLikeProfilePage, readProfileDisplayName } from "../lib/facebook/detect";
import { startAutoScrape } from "../lib/facebook/observer";
import { listPostsForProfile, onPostsChanged, savePost } from "../lib/storage";
import { getSession, onSessionChanged } from "../lib/auth";
import { queueForSync } from "../lib/sync";
import type { FacebookPost, ProfileContext } from "../lib/facebook/types";

import themeCss from "../styles/theme.css?raw";
import panelCss from "../styles/panel.css?raw";
import "@fontsource/mona-sans/400.css";
import "@fontsource/mona-sans/500.css";
import "@fontsource/mona-sans/600.css";
import "@fontsource/mona-sans/700.css";
import "@fontsource/mona-sans/800.css";

/* Content script entry.
 *
 * Mounts a single React tree (bubble + panel) inside a Shadow DOM attached
 * to document.body. The shadow boundary keeps Facebook's CSS out and our
 * styles in, which matters because Facebook ships a lot of `*` selectors
 * that would otherwise repaint our panel.
 *
 * Re-runs profile detection on every Facebook SPA navigation by patching
 * history.pushState/replaceState — Facebook's router doesn't emit any event
 * we can subscribe to directly.
 */

const HOST_ID = "__socialpulse_host__";

function mount() {
  if (document.getElementById(HOST_ID)) return; // already mounted

  const host = document.createElement("div");
  host.id = HOST_ID;
  // Keep host out of document flow.
  host.style.cssText = "all: initial; position: fixed; inset: 0; pointer-events: none; z-index: 2147483640;";
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = themeCss + "\n" + panelCss;
  shadow.appendChild(style);

  const root = document.createElement("div");
  root.className = "panel-root";
  // Children handle their own pointer-events; the host stays transparent so
  // Facebook clicks pass through everywhere except on the bubble + panel.
  root.style.cssText = "pointer-events: none;";
  shadow.appendChild(root);

  document.body.appendChild(host);
  // Theme attribute lives on the shadow host so :host([data-theme="dark"])
  // selectors in theme.css can resolve.
  applyTheme(host, readTheme());

  const reactRoot = createRoot(root);
  reactRoot.render(<App host={host} />);
  return reactRoot;
}

const THEME_KEY = "socialpulse.theme.v1";
type Theme = "light" | "dark";

function readTheme(): Theme {
  // Dark is the default for SocialPulse — light is opt-in via the toggle.
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch { /* sandboxed iframes — fall through */ }
  return "dark";
}

function applyTheme(host: HTMLElement, theme: Theme) {
  if (theme === "light") host.setAttribute("data-theme", "light");
  else host.removeAttribute("data-theme");
}

function App({ host }: { host: HTMLElement }) {
  const [profile, setProfile] = useState<ProfileContext | null>(null);
  const [open, setOpen] = useState(false);
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [capturing, setCapturing] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [theme, setTheme] = useState<Theme>(readTheme());

  const stopAutoScrapeRef = useRef<(() => void) | null>(null);
  const capturingTimerRef = useRef<number | null>(null);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(host, next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
  }

  // Initial session probe + subscribe.
  useEffect(() => {
    getSession().then((s) => setSignedIn(!!s));
    return onSessionChanged((s) => setSignedIn(!!s));
  }, []);

  // SPA-aware URL detection.
  useEffect(() => {
    const recheck = () => {
      const next = detectProfileFromUrl();
      const enriched = next && looksLikeProfilePage()
        ? { ...next, displayName: readProfileDisplayName() }
        : null;
      setProfile((cur) => {
        if (cur?.username === enriched?.username) return cur;
        return enriched;
      });
    };

    recheck();
    window.addEventListener("popstate", recheck);
    const origPush = history.pushState;
    const origReplace = history.replaceState;
    history.pushState = function (...args) {
      const r = origPush.apply(this, args);
      queueMicrotask(recheck);
      return r;
    };
    history.replaceState = function (...args) {
      const r = origReplace.apply(this, args);
      queueMicrotask(recheck);
      return r;
    };
    // Facebook delays profile DOM hydration; re-check shortly after navigation.
    const interval = window.setInterval(recheck, 1500);

    return () => {
      window.removeEventListener("popstate", recheck);
      history.pushState = origPush;
      history.replaceState = origReplace;
      window.clearInterval(interval);
    };
  }, []);

  // Auto-scrape lifecycle: tied to the active profile.
  useEffect(() => {
    stopAutoScrapeRef.current?.();
    stopAutoScrapeRef.current = null;
    if (!profile) return;

    listPostsForProfile(profile.username).then(setPosts);

    stopAutoScrapeRef.current = startAutoScrape({
      profile,
      onCapture: async (post) => {
        await savePost(post);
        // Best-effort sync; ignored if signed out (queued via storage).
        void queueForSync([post]);
      },
      onActivity: () => {
        setCapturing(true);
        if (capturingTimerRef.current) window.clearTimeout(capturingTimerRef.current);
        capturingTimerRef.current = window.setTimeout(() => setCapturing(false), 1500);
      },
    });

    return () => {
      stopAutoScrapeRef.current?.();
      stopAutoScrapeRef.current = null;
    };
  }, [profile]);

  // Live posts list updates from storage (covers cross-tab capture).
  useEffect(() => {
    if (!profile) return;
    return onPostsChanged((nextPosts, profileId) => {
      if (profileId !== profile.username) return;
      setPosts(nextPosts);
    });
  }, [profile]);

  const showBubble = !!profile;

  return (
    <div style={{ pointerEvents: "auto" }}>
      {showBubble && <Bubble hidden={open} onClick={() => setOpen(true)} />}
      <Panel
        open={open}
        onClose={() => setOpen(false)}
        profile={profile}
        posts={posts}
        capturing={capturing}
        signedIn={signedIn}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}

// Mount once the body exists.
if (document.body) {
  mount();
} else {
  document.addEventListener("DOMContentLoaded", () => mount(), { once: true });
}
