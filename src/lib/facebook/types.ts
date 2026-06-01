export type PostType = "video" | "slideshow" | "carousel" | "photo" | "link";

export interface FacebookPost {
  /** Stable ID from the post URL (Facebook's `pfbid…` or numeric `story_fbid`). */
  id: string;
  /** Permalink to the post on Facebook. */
  url: string;
  /** Profile this post was captured from (the active profile, not necessarily the author). */
  profileId: string;
  profileUsername: string;
  type: PostType;
  caption: string;
  /** First-frame thumbnail (video), first slide (slideshow/carousel), photo, or OG image (link). */
  thumbnailUrl: string | null;
  /** Direct video URL when type === "video" and one is exposed. Often unavailable. */
  videoUrl: string | null;
  stats: {
    likes: number;
    comments: number;
    shares: number;
  };
  /** ISO 8601 timestamp from the post header (e.g. derived from "Mar 12 at 8:42 PM"). */
  postedAt: string | null;
  /** Epoch ms when we first captured the post. */
  capturedAt: number;
}

export interface ProfileContext {
  username: string;
  displayName: string | null;
  url: string;
}

export type SortOrder = "recent" | "likes" | "comments" | "shares";
export type FilterType = "all" | PostType;
