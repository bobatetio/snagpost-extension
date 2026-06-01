import type { FacebookPost, PostType, ProfileContext } from "./types";

/* Facebook DOM scraping.
 *
 * Facebook's class names are obfuscated and rotate. Selectors here are all
 * structural (role + aria + href patterns) so they survive class churn better.
 * Centralized so a single file is updated when Facebook changes its DOM.
 *
 * Each post on a profile timeline is a `[role="article"]` element. Inside:
 *   - permalink anchor: <a href="/<handle>/posts/pfbid..."> or .../videos/...
 *   - caption: a div with `dir="auto"` containing user-generated copy
 *   - media: <img>, <video>, or carousel container
 *   - reactions row: aria-label includes "Like:", "Comment", "Share"
 */

const SELECTORS = {
  article: '[role="article"]',
  permalink: 'a[href*="/posts/"], a[href*="/videos/"], a[href*="/photos/"], a[href*="story_fbid"]',
  caption: 'div[dir="auto"]',
  image: 'img[src]:not([width="16"]):not([height="16"])',
  video: "video",
  carousel: '[aria-roledescription="carousel"]',
  reactionsRow: '[role="toolbar"]',
  reactionLabel: '[aria-label]',
  timestamp: 'a[role="link"][aria-label]',
};

/** Extract a stable post ID from any of Facebook's URL shapes. */
export function extractPostId(href: string | null | undefined): string | null {
  if (!href) return null;
  // pfbid IDs (preferred — opaque, stable)
  const pfbid = href.match(/pfbid[A-Za-z0-9]+/);
  if (pfbid) return pfbid[0];
  // story_fbid query param
  try {
    const u = new URL(href, location.origin);
    const sid = u.searchParams.get("story_fbid");
    if (sid) return sid;
    // /posts/<numeric>
    const numericPosts = u.pathname.match(/\/posts\/(\d+)/);
    if (numericPosts) return numericPosts[1];
    // /videos/<numeric>
    const numericVideos = u.pathname.match(/\/videos\/(\d+)/);
    if (numericVideos) return `v_${numericVideos[1]}`;
    // /photos/.../<numeric>
    const numericPhotos = u.pathname.match(/\/photos\/[^/]+\/(\d+)/);
    if (numericPhotos) return `p_${numericPhotos[1]}`;
  } catch {
    /* fall through */
  }
  return null;
}

function pickPermalink(article: Element): string | null {
  const links = article.querySelectorAll<HTMLAnchorElement>(SELECTORS.permalink);
  for (const a of links) {
    const id = extractPostId(a.href);
    if (id) return a.href;
  }
  return null;
}

/** Number-string parser for Facebook's count strings: "1.2K", "3,456", "4M". */
function parseCount(raw: string | null | undefined): number {
  if (!raw) return 0;
  const s = raw.trim().replace(/,/g, "");
  const m = s.match(/^(\d+(?:\.\d+)?)([KMB])?/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const suffix = (m[2] || "").toUpperCase();
  switch (suffix) {
    case "K": return Math.round(n * 1_000);
    case "M": return Math.round(n * 1_000_000);
    case "B": return Math.round(n * 1_000_000_000);
    default: return Math.round(n);
  }
}

function readStats(article: Element): { likes: number; comments: number; shares: number } {
  const stats = { likes: 0, comments: 0, shares: 0 };

  // Reactions count: usually a span like "1.2K" near the toolbar with aria-label
  // "Like: 1.2K reactions" or similar.
  const reactionEl = article.querySelector('[aria-label*="reaction" i], [aria-label*="Like:" i]');
  if (reactionEl) {
    const label = reactionEl.getAttribute("aria-label") || reactionEl.textContent || "";
    stats.likes = parseCount(label.match(/[\d.,]+\s*[KMB]?/i)?.[0]);
  }
  if (!stats.likes) {
    // Fallback: find the leftmost number-looking span in the toolbar row
    const toolbar = article.querySelector(SELECTORS.reactionsRow);
    const numberSpan = toolbar?.querySelector('span[aria-hidden="true"], span');
    stats.likes = parseCount(numberSpan?.textContent);
  }

  // Comments + shares: text like "12 comments" / "4 shares" near the toolbar.
  const text = article.textContent || "";
  const commentMatch = text.match(/([\d.,]+\s*[KMB]?)\s+comment/i);
  const shareMatch = text.match(/([\d.,]+\s*[KMB]?)\s+share/i);
  stats.comments = parseCount(commentMatch?.[1]);
  stats.shares = parseCount(shareMatch?.[1]);
  return stats;
}

function detectType(article: Element): PostType {
  if (article.querySelector(SELECTORS.video)) return "video";
  if (article.querySelector(SELECTORS.carousel)) return "carousel";
  // Slideshow: multiple images stacked, often within a "slideshow" aria-roledescription
  const slideshow = article.querySelector('[aria-roledescription="slideshow"]');
  if (slideshow) return "slideshow";
  // Link preview: an outbound anchor with an image preview
  const outbound = article.querySelector('a[href^="https://l.facebook.com/l.php"], a[target="_blank"][rel*="nofollow"]');
  if (outbound && article.querySelector(SELECTORS.image)) return "link";
  if (article.querySelector(SELECTORS.image)) return "photo";
  return "photo";
}

function readCaption(article: Element): string {
  // Captions are inside dir="auto" divs. Often there's a "See more" expand link;
  // we capture only what's visible. Take the longest text node within article.
  const candidates = article.querySelectorAll(SELECTORS.caption);
  let best = "";
  for (const c of candidates) {
    const text = (c as HTMLElement).innerText?.trim() ?? "";
    // Skip metadata-y short strings (handles, dates, "Public", etc.)
    if (text.length > best.length && text.length > 8) best = text;
  }
  return best;
}

function readThumbnail(article: Element): string | null {
  const video = article.querySelector<HTMLVideoElement>(SELECTORS.video);
  if (video?.poster) return video.poster;
  const img = article.querySelector<HTMLImageElement>(SELECTORS.image);
  return img?.src ?? null;
}

function readVideoUrl(article: Element): string | null {
  const video = article.querySelector<HTMLVideoElement>(SELECTORS.video);
  return video?.currentSrc || video?.src || null;
}

function readTimestamp(article: Element): string | null {
  // Facebook timestamps live on an <a> with aria-label like "Tuesday 5 March 2024 at 14:32".
  const anchors = article.querySelectorAll<HTMLAnchorElement>(SELECTORS.timestamp);
  for (const a of anchors) {
    const label = a.getAttribute("aria-label");
    if (!label) continue;
    if (/\d{4}|at\s+\d/i.test(label)) {
      const parsed = Date.parse(label);
      if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
      return label;
    }
  }
  return null;
}

/** Extract a single post from a `[role="article"]` element. Returns null if unparsable. */
export function extractPost(article: Element, profile: ProfileContext): FacebookPost | null {
  const url = pickPermalink(article);
  const id = extractPostId(url);
  if (!id || !url) return null;

  return {
    id,
    url,
    profileId: profile.username,
    profileUsername: profile.username,
    type: detectType(article),
    caption: readCaption(article),
    thumbnailUrl: readThumbnail(article),
    videoUrl: readVideoUrl(article),
    stats: readStats(article),
    postedAt: readTimestamp(article),
    capturedAt: Date.now(),
  };
}

/** Find every `[role="article"]` currently in the DOM. */
export function findAllArticles(): Element[] {
  return Array.from(document.querySelectorAll(SELECTORS.article));
}
