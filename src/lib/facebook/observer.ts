import { extractPost, findAllArticles } from "./scrape";
import type { FacebookPost, ProfileContext } from "./types";

/* Auto-scrape pipeline.
 *
 * Two observers, debounced together:
 *   - MutationObserver on document.body — catches new articles as Facebook
 *     virtualizes them in/out of the DOM.
 *   - IntersectionObserver per article — only extract when an article is
 *     near/in the viewport. This is what makes capture feel "as you scroll"
 *     while keeping work proportional to what the user actually sees.
 *
 * Idle Facebook tabs (no scroll, no mutations) cost zero work after setup.
 */

interface AutoScrapeHandlers {
  profile: ProfileContext;
  onCapture: (post: FacebookPost) => void;
  onActivity: () => void;
}

const PROCESSED = new WeakSet<Element>();

export function startAutoScrape({ profile, onCapture, onActivity }: AutoScrapeHandlers) {
  const captured = new Set<string>();

  const intersection = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      intersection.unobserve(el);
      const post = extractPost(el, profile);
      if (!post) continue;
      if (captured.has(post.id)) continue;
      captured.add(post.id);
      onCapture(post);
      onActivity();
    }
  }, { rootMargin: "0px 0px 200px 0px", threshold: 0.1 });

  function registerNew() {
    for (const article of findAllArticles()) {
      if (PROCESSED.has(article)) continue;
      PROCESSED.add(article);
      intersection.observe(article);
    }
  }

  registerNew();

  let scheduled = false;
  const idle: (cb: () => void) => number =
    typeof window.requestIdleCallback === "function"
      ? (cb) => window.requestIdleCallback!(cb, { timeout: 250 })
      : (cb) => window.setTimeout(cb, 80);

  const mutation = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    idle(() => {
      scheduled = false;
      registerNew();
      onActivity();
    });
  });
  mutation.observe(document.body, { childList: true, subtree: true });

  return () => {
    intersection.disconnect();
    mutation.disconnect();
  };
}
