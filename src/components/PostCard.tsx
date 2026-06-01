import { ExternalLink, Heart, MessageCircle, Share2 } from "lucide-react";
import type { FacebookPost } from "../lib/facebook/types";

interface PostCardProps {
  post: FacebookPost;
  expanded: boolean;
  onToggle: () => void;
}

const TYPE_LABELS: Record<FacebookPost["type"], string> = {
  video: "Video",
  slideshow: "Slideshow",
  carousel: "Carousel",
  photo: "Photo",
  link: "Link",
};

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso; // fallback to raw label
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}

export function PostCard({ post, expanded, onToggle }: PostCardProps) {
  return (
    <article
      className="post-card"
      data-expanded={expanded}
      onClick={onToggle}
      role="button"
      aria-expanded={expanded}
    >
      <div className="post-thumb">
        {post.thumbnailUrl ? (
          <img src={post.thumbnailUrl} alt="" loading="lazy" />
        ) : null}
        <span className="type-pill" data-type={post.type}>
          {TYPE_LABELS[post.type]}
        </span>
      </div>

      <div className="post-body">
        {post.caption && <p className="post-caption">{post.caption}</p>}

        <div className="post-stats">
          <span className="post-stat" title="Likes">
            <Heart size={13} strokeWidth={1.75} />
            {formatCount(post.stats.likes)}
          </span>
          <span className="post-stat" title="Comments">
            <MessageCircle size={13} strokeWidth={1.75} />
            {formatCount(post.stats.comments)}
          </span>
          <span className="post-stat" title="Shares">
            <Share2 size={13} strokeWidth={1.75} />
            {formatCount(post.stats.shares)}
          </span>
        </div>

        <span className="post-meta">{formatDate(post.postedAt)}</span>

        {expanded && (
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="view-on-fb"
            onClick={(e) => e.stopPropagation()}
          >
            View on Facebook
            <ExternalLink size={14} strokeWidth={1.75} />
          </a>
        )}
      </div>
    </article>
  );
}
