import type { ProfileContext } from "./types";

/* Facebook profile URL shapes:
 *   facebook.com/<username>                 → handle profile
 *   facebook.com/<username>/                → trailing slash
 *   facebook.com/profile.php?id=<numeric>   → numeric profile
 *
 * Excluded surfaces (anything else): home feed, /watch, /groups, /marketplace,
 * /messages, /events, /pages/create, /help, /settings, etc.
 *
 * We treat unknown single-segment paths as profiles unless they are in the
 * blocklist. Facebook doesn't expose a clean way to verify "is this a profile
 * page" from the URL alone, so the panel mount also re-checks for profile DOM
 * markers before showing the bubble.
 */

const NON_PROFILE_TOP_SEGMENTS = new Set([
  "watch", "marketplace", "groups", "events", "messages", "messenger",
  "gaming", "pages", "settings", "help", "policies", "privacy", "terms",
  "share", "stories", "reel", "reels", "live", "ads", "business",
  "friends", "saved", "notifications", "memories", "search", "login",
  "signup", "recover", "checkpoint", "dialog", "pg", "dyi", "support",
  "directory", "bookmarks", "fundraisers", "weather", "offers",
  "places", "games", "jobs", "crisisresponse", "covid_information",
  "climatesciencecenter", "votinginformationcenter", "topic",
  "explore", "people", "lite", "watchparty", "instant_articles",
]);

export function detectProfileFromUrl(href: string = location.href): ProfileContext | null {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return null;
  }
  if (!/(^|\.)facebook\.com$/.test(url.hostname)) return null;

  // Numeric profile: facebook.com/profile.php?id=12345
  if (url.pathname === "/profile.php" || url.pathname === "/profile.php/") {
    const id = url.searchParams.get("id");
    if (!id) return null;
    return { username: id, displayName: null, url: `${url.origin}/profile.php?id=${id}` };
  }

  // Handle profile: first path segment, ignoring trailing tabs like /photos /about
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  const handle = parts[0];
  if (NON_PROFILE_TOP_SEGMENTS.has(handle.toLowerCase())) return null;
  // Skip URLs that are clearly not handles (contain a dot, look like a file)
  if (/\.(php|html?)$/i.test(handle)) return null;

  return {
    username: handle,
    displayName: null,
    url: `${url.origin}/${handle}`,
  };
}

/** Best-effort lookup of the profile's displayed name from the DOM. */
export function readProfileDisplayName(): string | null {
  // Facebook's profile header has been stable around an h1 in the cover area.
  const h1 = document.querySelector("h1");
  const text = h1?.textContent?.trim();
  return text && text.length > 0 && text.length < 120 ? text : null;
}

/** True if the page DOM looks like a profile (cover area + h1 + tabs). */
export function looksLikeProfilePage(): boolean {
  if (!document.querySelector("h1")) return false;
  // Facebook profile pages have an "Intro" / "Posts" tablist. Check loosely.
  const hasTabs = !!document.querySelector('[role="tablist"], [role="tab"]');
  return hasTabs;
}
