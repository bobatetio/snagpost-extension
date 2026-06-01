interface BubbleProps {
  hidden: boolean;
  flash?: boolean;
  onClick: () => void;
}

export function Bubble({ hidden, flash, onClick }: BubbleProps) {
  return (
    <button
      type="button"
      className="bubble"
      data-hidden={hidden}
      data-flash={flash || undefined}
      onClick={onClick}
      aria-label="Open SocialPulse"
    >
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
        <path
          d="M5.5 3.5h11c.55 0 1 .45 1 1v13.4a.6.6 0 0 1-.93.5L11 14.5l-5.57 3.9A.6.6 0 0 1 4.5 17.9V4.5c0-.55.45-1 1-1Z"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
