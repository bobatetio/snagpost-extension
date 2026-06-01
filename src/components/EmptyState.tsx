interface EmptyStateProps {
  variant: "no-profile" | "no-posts";
  onCta?: () => void;
}

export function EmptyState({ variant, onCta }: EmptyStateProps) {
  const heading =
    variant === "no-profile"
      ? "Open a Facebook profile to start grabbing."
      : "No posts captured yet.";

  const sub =
    variant === "no-profile"
      ? "SocialPulse captures every post as you scroll — no copy-paste, no manual saving."
      : "Scroll the profile and posts will appear here as they come into view.";

  return (
    <div className="empty">
      <div className="empty-stack" aria-hidden="true">
        <div className="empty-stack-card back" />
        <div className="empty-stack-card mid" />
        <div className="empty-stack-card front" />
      </div>
      <h2 className="empty-title">{heading}</h2>
      <p className="empty-sub">{sub}</p>
      {onCta && (
        <button type="button" className="empty-cta" onClick={onCta}>
          View example
        </button>
      )}
    </div>
  );
}
