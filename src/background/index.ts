/* Background service worker.
 *
 * Currently thin — most logic lives in the content script because it owns the
 * page DOM and the Shadow-DOM panel. The worker is the right home for:
 *   - The TokScript sign-in flow (open auth tab, listen for redirect, persist
 *     session via lib/auth.setSession).
 *   - Periodic flush of unsynced posts when the user gains a session.
 *
 * Both are stubbed below.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log("[SocialPulse] installed");
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type === "socialpulse:sign-in") {
    // TODO: open TokScript auth URL in a new tab and capture the resulting session.
    // For now, just acknowledge so the sender promise resolves.
    sendResponse({ ok: true, stub: true });
    return true;
  }
  return false;
});
