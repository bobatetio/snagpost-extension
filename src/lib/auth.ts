/* TokScript auth integration — stub.
 *
 * The build prompt says SocialPulse shares TokScript's session: signed into
 * TokScript = signed into SocialPulse. Until the real TokScript auth surface
 * is available, this module exposes a clean interface the rest of the
 * extension codes against. Swap getSession() for the real call later — no
 * other file needs to change.
 *
 * Current behavior: returns null (signed out). Panel shows the sign-in CTA.
 */

export interface Session {
  userId: string;
  email: string | null;
  // Bearer token usable against the TokScript API namespace (e.g. /api/facebook/posts).
  accessToken: string;
}

const SESSION_KEY = "socialpulse.session.v1";

// When the popup is loaded outside the extension (e.g. Vite dev preview at
// localhost), chrome.storage isn't available. Fall back to localStorage so
// the flow stays clickable during local demos.
const hasChromeStorage = typeof chrome !== "undefined" && !!chrome?.storage?.local;

export async function getSession(): Promise<Session | null> {
  if (!hasChromeStorage) {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  }
  const raw = await chrome.storage.local.get(SESSION_KEY);
  return (raw[SESSION_KEY] as Session) ?? null;
}

const SESSION_EVENT = "socialpulse:session-change";

export async function setSession(session: Session | null): Promise<void> {
  if (!hasChromeStorage) {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else localStorage.removeItem(SESSION_KEY);
    // localStorage doesn't fire "storage" in the same tab, so emit our own
    // event for in-process subscribers (preview mode).
    window.dispatchEvent(new CustomEvent(SESSION_EVENT, { detail: session }));
    return;
  }
  if (session) {
    await chrome.storage.local.set({ [SESSION_KEY]: session });
  } else {
    await chrome.storage.local.remove(SESSION_KEY);
  }
}

export function onSessionChanged(handler: (session: Session | null) => void) {
  if (!hasChromeStorage) {
    const listener = (e: Event) => handler((e as CustomEvent<Session | null>).detail);
    window.addEventListener(SESSION_EVENT, listener);
    return () => window.removeEventListener(SESSION_EVENT, listener);
  }
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: "sync" | "local" | "managed" | "session",
  ) => {
    if (area !== "local") return;
    if (!changes[SESSION_KEY]) return;
    handler((changes[SESSION_KEY].newValue as Session) ?? null);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
