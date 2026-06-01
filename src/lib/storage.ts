import type { FacebookPost } from "./facebook/types";

/* chrome.storage.local wrapper. Posts are keyed by id, so dedup is implicit
 * via Object.assign (last write wins). Keeps state available to the panel
 * across page navigations and to the dashboard sync layer.
 */

const POSTS_KEY = "socialpulse.posts.v1";

interface PostsBlob {
  byId: Record<string, FacebookPost>;
}

async function readBlob(): Promise<PostsBlob> {
  const raw = await chrome.storage.local.get(POSTS_KEY);
  return (raw[POSTS_KEY] as PostsBlob) ?? { byId: {} };
}

async function writeBlob(blob: PostsBlob): Promise<void> {
  await chrome.storage.local.set({ [POSTS_KEY]: blob });
}

export async function savePost(post: FacebookPost): Promise<void> {
  const blob = await readBlob();
  blob.byId[post.id] = post;
  await writeBlob(blob);
}

export async function savePosts(posts: FacebookPost[]): Promise<void> {
  if (posts.length === 0) return;
  const blob = await readBlob();
  for (const p of posts) blob.byId[p.id] = p;
  await writeBlob(blob);
}

export async function listPostsForProfile(profileId: string): Promise<FacebookPost[]> {
  const blob = await readBlob();
  return Object.values(blob.byId).filter((p) => p.profileId === profileId);
}

export function onPostsChanged(handler: (posts: FacebookPost[], profileId: string) => void) {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    area: "sync" | "local" | "managed" | "session",
  ) => {
    if (area !== "local") return;
    if (!changes[POSTS_KEY]) return;
    const blob = (changes[POSTS_KEY].newValue as PostsBlob) ?? { byId: {} };
    const grouped = new Map<string, FacebookPost[]>();
    for (const p of Object.values(blob.byId)) {
      const arr = grouped.get(p.profileId) ?? [];
      arr.push(p);
      grouped.set(p.profileId, arr);
    }
    for (const [profileId, posts] of grouped) handler(posts, profileId);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
