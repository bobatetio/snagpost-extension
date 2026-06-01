import type { FacebookPost } from "./facebook/types";
import { getSession } from "./auth";

/* Backend sync — stub.
 *
 * Real implementation will POST to the TokScript API namespace
 * (e.g. https://api.tokscript.com/api/facebook/posts) using the session token.
 * Until that endpoint exists, queueForSync() just resolves. Posts remain in
 * chrome.storage.local and will be flushable later.
 *
 * Keep the queue idempotent on `post.id` — backend should upsert.
 */

const ENDPOINT = "https://api.tokscript.com/api/facebook/posts"; // TODO: confirm with backend

export interface SyncResult {
  ok: boolean;
  reason?: "no-session" | "network" | "server" | "stub";
}

export async function queueForSync(posts: FacebookPost[]): Promise<SyncResult> {
  if (posts.length === 0) return { ok: true };

  const session = await getSession();
  if (!session) return { ok: false, reason: "no-session" };

  // Real call commented out until the endpoint is confirmed:
  //
  // const res = await fetch(ENDPOINT, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${session.accessToken}`,
  //   },
  //   body: JSON.stringify({ posts }),
  // });
  // if (!res.ok) return { ok: false, reason: res.status >= 500 ? "server" : "network" };
  // return { ok: true };

  void ENDPOINT;
  return { ok: false, reason: "stub" };
}
