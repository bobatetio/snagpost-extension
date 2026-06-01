import { Fragment, useState } from "react";
import { Calendar, Info } from "lucide-react";
import { Tooltip } from "./Tooltip";
import type { FacebookPost, PostType } from "../lib/facebook/types";

/* Per-type tone resolver — keeps the same lookup wherever we need a color
 * for a tooltip indicator dot. */
const TONE_VAR: Record<PostType, string> = {
  video:     "var(--tone-video)",
  carousel:  "var(--tone-carousel)",
  slideshow: "var(--tone-slideshow)",
  photo:     "var(--tone-photo)",
  link:      "var(--tone-link)",
};

/* Analytics blocks — 1:1 with the SocialPulse Figma (node 8:46).
 *
 * Layout pattern: every section is an uppercase muted label OUTSIDE the
 * card, followed by a dark gradient-bordered card holding the data.
 *
 * Post-type tone colors come from the Figma legend (Video=pink, Carousel=
 * lavender, Slide Show=pale-blue, Photo+Link=cyan).
 */

const TYPE_LABELS: Record<PostType, string> = {
  video: "Video",
  slideshow: "Slide Show",
  carousel: "Carousel",
  photo: "Photo",
  link: "Link",
};
const TYPE_ORDER: PostType[] = ["video", "carousel", "slideshow", "photo", "link"];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
}

function formatShortDate(ts: number): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

/* SVG donut slice path. Builds the four-corner shape: outer arc from
 * `start` to `end`, line inward, inner arc back, line back to start.
 * Angles in radians; SVG y-axis is inverted but the math is consistent. */
function arcPath(c: number, ro: number, ri: number, start: number, end: number): string {
  const cos = Math.cos;
  const sin = Math.sin;
  const x0 = c + ro * cos(start), y0 = c + ro * sin(start);
  const x1 = c + ro * cos(end),   y1 = c + ro * sin(end);
  const x2 = c + ri * cos(end),   y2 = c + ri * sin(end);
  const x3 = c + ri * cos(start), y3 = c + ri * sin(start);
  const large = end - start > Math.PI ? 1 : 0;
  return `M ${x0} ${y0} A ${ro} ${ro} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${ri} ${ri} 0 ${large} 0 ${x3} ${y3} Z`;
}

/* ---------- Engagement (4 stats + date range tag in label row) ---------- */

export function EngagementCard({ posts }: { posts: FacebookPost[] }) {
  const totals = posts.reduce(
    (a, p) => ({
      likes: a.likes + p.stats.likes,
      comments: a.comments + p.stats.comments,
      shares: a.shares + p.stats.shares,
    }),
    { likes: 0, comments: 0, shares: 0 },
  );
  const total = totals.likes + totals.comments + totals.shares;
  const avg = posts.length > 0 ? Math.round(total / posts.length) : 0;

  const stamps = posts
    .map((p) => (p.postedAt ? Date.parse(p.postedAt) : p.capturedAt))
    .filter((n) => Number.isFinite(n));
  const oldest = stamps.length ? Math.min(...stamps) : 0;
  const newest = stamps.length ? Math.max(...stamps) : 0;

  const stats = [
    { label: "Likes",     value: totals.likes },
    { label: "Comments",  value: totals.comments },
    { label: "Shares",    value: totals.shares },
    { label: "Avg. Post", value: avg },
  ];

  return (
    <section className="sp-section" aria-label="Engagement">
      <div className="sp-section-head">
        <span className="sp-section-label sp-section-label-with-icon">
          Engagement
          <Tooltip
            className="sp-section-info-wrap"
            side="bottom"
            label="Total likes, comments, shares + average engagement across captured posts"
          >
            <Info size={11} strokeWidth={2} aria-hidden="true" className="sp-section-info" />
          </Tooltip>
        </span>
        {posts.length > 0 && (
          <span className="sp-section-label sp-section-label-with-icon">
            <Calendar size={11} strokeWidth={2} aria-hidden="true" />
            {formatShortDate(oldest)} – {formatShortDate(newest)}
          </span>
        )}
      </div>
      <div className="sp-card sp-engagement-card">
        {stats.map((s) => (
          <div key={s.label} className="sp-metric">
            <span className="sp-metric-value">{formatCount(s.value)}</span>
            <span className="sp-metric-label">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- Post types (donut + legend) ---------- */

export function PostTypeBreakdown({ posts }: { posts: FacebookPost[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const counts: Record<PostType, number> = { video: 0, carousel: 0, slideshow: 0, photo: 0, link: 0 };
  for (const p of posts) counts[p.type] += 1;
  const total = posts.length;
  const rows = TYPE_ORDER.filter((t) => counts[t] > 0);
  if (rows.length === 0) return null;

  // Build per-slice angular ranges. Start at 12 o'clock and go clockwise.
  // The 1-slice case can't draw a full 360° arc with a single SVG arc cmd
  // (start & end points coincide → ambiguous), so we clamp just below 2π.
  const SIZE = 120;
  const RO = 60;
  const RI = 50;
  const C = SIZE / 2;
  const TWO_PI = Math.PI * 2;
  let acc = -Math.PI / 2;
  const slices = rows.map((t) => {
    let span = total > 0 ? (counts[t] / total) * TWO_PI : 0;
    if (rows.length === 1) span = TWO_PI - 0.0001;
    const start = acc;
    const end = acc + span;
    acc = end;
    const n = counts[t];
    const pct = total > 0 ? (n / total) * 100 : 0;
    return { type: t, count: n, pct, start, end, d: arcPath(C, RO, RI, start, end) };
  });

  const hovered = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <section className="sp-section" aria-label="Post types">
      <div className="sp-section-head">
        <span className="sp-section-label sp-section-label-with-icon">
          Post types
          <Tooltip
            className="sp-section-info-wrap"
            side="bottom"
            label="Distribution of captured posts by content type"
          >
            <Info size={11} strokeWidth={2} aria-hidden="true" className="sp-section-info" />
          </Tooltip>
        </span>
      </div>
      <div className="sp-card sp-types-card">
        <div className="sp-donut-wrap">
          <div className="sp-donut">
            <svg
              className="sp-donut-svg"
              viewBox={`0 0 ${SIZE} ${SIZE}`}
              role="img"
              aria-label="Post types donut chart"
            >
              {slices.map((s, i) => (
                <path
                  key={s.type}
                  d={s.d}
                  fill={`var(--tone-${s.type})`}
                  opacity={hoveredIdx === null || hoveredIdx === i ? 1 : 0.45}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  style={{ cursor: "pointer", transition: "opacity 120ms ease" }}
                />
              ))}
            </svg>
            <div className="sp-donut-hole">
              <span className="sp-donut-total">{total.toLocaleString()}</span>
              <span className="sp-donut-sub">Posts</span>
            </div>
            {hovered && (
              <span className="sp-tip" data-side="top" role="tooltip">
                <span className="sp-tip-row">
                  <span className="sp-tip-dot" style={{ background: `var(--tone-${hovered.type})` }} />
                  <span className="sp-tip-label">
                    {TYPE_LABELS[hovered.type]}: {hovered.count.toLocaleString()}
                  </span>
                </span>
                <span className="sp-tip-hint">
                  {(Math.round(hovered.pct * 10) / 10)}% of all posts
                </span>
              </span>
            )}
          </div>
        </div>
        <ul className="sp-types-legend">
          {rows.map((t, idx) => {
            const n = counts[t];
            const pct = total > 0 ? Math.round((n / total) * 100) : 0;
            return (
              <Fragment key={t}>
                <li className="sp-types-row">
                  <Tooltip
                    className="sp-types-left"
                    label={`${TYPE_LABELS[t]}: ${n.toLocaleString()}`}
                    hint={`${pct}% of all posts`}
                    tone={TONE_VAR[t]}
                  >
                    <span className="sp-dot" data-tone={t} aria-hidden="true" />
                    <span className="sp-types-name">{TYPE_LABELS[t]}</span>
                  </Tooltip>
                  <span className="sp-types-value">{n.toLocaleString()} ({pct}%)</span>
                </li>
                {idx < rows.length - 1 && <li className="sp-types-divider" aria-hidden="true" />}
              </Fragment>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Engagement composition (type rows w/ decorative bar + metric pcts) ---------- */

export function EngagementComposition({ posts }: { posts: FacebookPost[] }) {
  const [activeTab, setActiveTab] = useState(0);

  const buckets: Record<PostType, { count: number; likes: number; comments: number; shares: number }> = {
    video: { count: 0, likes: 0, comments: 0, shares: 0 },
    carousel: { count: 0, likes: 0, comments: 0, shares: 0 },
    slideshow: { count: 0, likes: 0, comments: 0, shares: 0 },
    photo: { count: 0, likes: 0, comments: 0, shares: 0 },
    link: { count: 0, likes: 0, comments: 0, shares: 0 },
  };
  for (const p of posts) {
    const b = buckets[p.type];
    b.count += 1;
    b.likes += p.stats.likes;
    b.comments += p.stats.comments;
    b.shares += p.stats.shares;
  }
  const rows = TYPE_ORDER.filter((t) => buckets[t].count > 0);
  if (rows.length === 0) return null;

  const fmtPct = (n: number) => (Math.round(n * 10) / 10).toString();

  return (
    <section className="sp-section" aria-label="Engagement composition">
      <div className="sp-section-head">
        <span className="sp-section-label sp-section-label-with-icon">
          Engagement composition
          <Tooltip
            className="sp-section-info-wrap"
            side="bottom"
            label="How engagement (likes/comments/shares) splits within each post type"
          >
            <Info size={11} strokeWidth={2} aria-hidden="true" className="sp-section-info" />
          </Tooltip>
        </span>
      </div>
      <div className="sp-card sp-comp-card">
        <div className="sp-comp-tabs" role="tablist">
          {rows.map((t, i) => (
            <button
              key={t}
              type="button"
              role="tab"
              className="sp-comp-tab"
              data-active={i === Math.min(activeTab, rows.length - 1)}
              aria-selected={i === Math.min(activeTab, rows.length - 1)}
              onClick={() => setActiveTab(i)}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {(() => {
          const safeIdx = Math.min(activeTab, rows.length - 1);
          const t = rows[safeIdx];
          const b = buckets[t];
          const total = b.likes + b.comments + b.shares;
          const likesPct = total > 0 ? (b.likes / total) * 100 : 0;
          const commentsPct = total > 0 ? (b.comments / total) * 100 : 0;
          const sharesPct = total > 0 ? (b.shares / total) * 100 : 0;
          const typeLabelLower = TYPE_LABELS[t].toLowerCase();
          const typeNoun = b.count === 1 ? typeLabelLower : `${typeLabelLower}s`;
          const metrics = [
            { key: "likes",    label: "Likes",    value: b.likes,    pct: likesPct,    tone: "var(--tone-video)" },
            { key: "comments", label: "Comments", value: b.comments, pct: commentsPct, tone: "var(--tone-carousel)" },
            { key: "shares",   label: "Shares",   value: b.shares,   pct: sharesPct,   tone: "var(--tone-slideshow)" },
          ] as const;
          return (
            <div
              className="sp-comp-summary"
              role="img"
              aria-label={`${b.count} ${typeNoun} · ${formatCount(total)} total engagement, likes ${fmtPct(likesPct)}%, comments ${fmtPct(commentsPct)}%, shares ${fmtPct(sharesPct)}%`}
            >
              <div className="sp-comp-summary-head">
                <strong className="sp-comp-summary-num">{b.count}</strong>
                <span className="sp-comp-summary-sub">
                  {typeNoun} · {formatCount(total)} total engagement
                </span>
              </div>
              <div className="sp-comp-stacked-bar">
                {metrics.map((m) => (
                  <Tooltip
                    key={m.key}
                    className="sp-comp-stacked-seg"
                    data-metric={m.key}
                    style={{ width: `${m.pct}%` }}
                    label={`${m.label}: ${m.value.toLocaleString()}`}
                    hint={`${fmtPct(m.pct)}% of ${TYPE_LABELS[t]} engagement`}
                    tone={m.tone}
                  >
                    {m.pct >= 8 && <span className="sp-comp-stacked-pct">{Math.round(m.pct)}%</span>}
                  </Tooltip>
                ))}
              </div>
              <div className="sp-comp-summary-legend">
                {metrics.map((m) => (
                  <span key={m.key} className="sp-comp-summary-item">
                    <span className="sp-dot" data-metric={m.key} />
                    {m.label} · <b>{formatCount(m.value)}</b>
                  </span>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}

/* ---------- Top performing posts ---------- */

export function TopPostsList({ posts }: { posts: FacebookPost[] }) {
  if (posts.length === 0) return null;
  const top = [...posts]
    .sort((a, b) => b.stats.likes + b.stats.comments + b.stats.shares - (a.stats.likes + a.stats.comments + a.stats.shares))
    .slice(0, 3);


  return (
    <section className="sp-section" aria-label="Top performing posts">
      <div className="sp-section-head">
        <span className="sp-section-label sp-section-label-with-icon">
          Top performing posts
          <Tooltip
            className="sp-section-info-wrap"
            side="bottom"
            label="Posts with the highest total engagement (likes + comments + shares)"
          >
            <Info size={11} strokeWidth={2} aria-hidden="true" className="sp-section-info" />
          </Tooltip>
        </span>
      </div>
      <div className="sp-card sp-top-card">
        {top.map((p, idx) => {
          return (
            <a
              key={p.id}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="sp-top-row"
            >
              {p.thumbnailUrl ? (
                <img src={p.thumbnailUrl} alt="" className="sp-top-thumb" loading="lazy" />
              ) : (
                <span className="sp-top-thumb sp-top-thumb-fallback" aria-hidden="true">
                  {TYPE_LABELS[p.type].slice(0, 1)}
                </span>
              )}
              <div className="sp-top-body">
                <p className="sp-top-cap">
                  {(p.caption || "No caption").length > 48
                    ? `${(p.caption || "No caption").slice(0, 48)}...`
                    : (p.caption || "No caption")}
                </p>
                <div className="sp-top-stats">
                  <span>Likes <b>{formatCount(p.stats.likes)}</b></span>
                  <span>Comments <b>{formatCount(p.stats.comments)}</b></span>
                  <span>Shares <b>{formatCount(p.stats.shares)}</b></span>
                </div>
              </div>
              {idx < top.length - 1 && <div className="sp-top-divider" />}
            </a>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Posts by day of week (bar chart inside a card) ---------- */

export function DayOfWeekChart({ posts }: { posts: FacebookPost[] }) {
  if (posts.length === 0) return null;
  const counts = [0, 0, 0, 0, 0, 0, 0];
  for (const p of posts) {
    const d = p.postedAt ? new Date(p.postedAt) : new Date(p.capturedAt);
    if (Number.isNaN(d.getTime())) continue;
    const mon0 = (d.getDay() + 6) % 7;
    counts[mon0] += 1;
  }
  const peak = Math.max(...counts);
  const peakIdx = counts.indexOf(peak);

  return (
    <section className="sp-section" aria-label="Posts by day of week">
      <div className="sp-section-head">
        <span className="sp-section-label sp-section-label-with-icon">
          Posts by day of week
          <Tooltip
            className="sp-section-info-wrap"
            side="bottom"
            label="When the captured posts were published, grouped by day of the week"
          >
            <Info size={11} strokeWidth={2} aria-hidden="true" className="sp-section-info" />
          </Tooltip>
        </span>
        {peak > 0 && (
          <span className="sp-section-label">
            Peak <strong className="sp-section-strong">{DAYS[peakIdx]}· {peak}</strong>
          </span>
        )}
      </div>
      <div className="sp-card sp-dow-card">
        <div className="sp-dow-bars">
          {DAYS.map((day, i) => {
            const isPeak = i === peakIdx && peak > 0;
            const heightPct = peak > 0 ? (counts[i] / peak) * 100 : 0;
            return (
              <Tooltip
                key={i}
                className="sp-dow-col"
                data-peak={isPeak}
                label={`${day}: ${counts[i]} ${counts[i] === 1 ? "post" : "posts"}`}
                hint={isPeak ? "Peak day" : undefined}
                tone="var(--tone-video)"
              >
                <span className="sp-dow-count">{counts[i]}</span>
                <div className="sp-dow-track">
                  <div className="sp-dow-fill" style={{ height: `${heightPct}%` }} />
                </div>
              </Tooltip>
            );
          })}
        </div>
        <div className="sp-dow-axis">
          {DAYS.map((day, i) => (
            <span key={i} className="sp-dow-label" data-peak={i === peakIdx && peak > 0}>{day}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
