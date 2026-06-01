/* SocialPulse wordmark — purple rounded-square mark with a white bookmark
 * glyph, followed by "Social" (medium) + "Pulse" (bold). */

export function Wordmark() {
  return (
    <span className="wordmark">
      <span className="wordmark-mark" aria-hidden="true">
        <BookmarkGlyph />
      </span>
      <span className="wordmark-text">
        <span className="wordmark-light">Social</span>
        <span className="wordmark-bold">Pulse</span>
      </span>
    </span>
  );
}

function BookmarkGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3.5 2.25h7c.41 0 .75.34.75.75v8.5a.5.5 0 0 1-.79.41L7 9.5l-3.46 2.41a.5.5 0 0 1-.79-.41V3c0-.41.34-.75.75-.75Z"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
