import { useEffect } from "react";

interface ScanningProps {
  onDone: () => void;
  /** ms to simulate scanning before auto-advancing. */
  durationMs?: number;
}

export function Scanning({ onDone, durationMs = 1800 }: ScanningProps) {
  useEffect(() => {
    const id = setTimeout(onDone, durationMs);
    return () => clearTimeout(id);
  }, [onDone, durationMs]);

  return (
    <div className="scanning-stage">
      <div className="scanning-ring" aria-hidden="true" />
      <div className="scanning-title">Setting things up…</div>
      <div className="scanning-sub">
        SocialPulse is preparing your library. This usually takes a few seconds.
      </div>
    </div>
  );
}
