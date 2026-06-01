import { useState, type CSSProperties, type ReactNode } from "react";

/* Hover tooltip primitive — renders a single wrapping element with a hover
 * handler. Caller passes a className so the wrap merges into the layout
 * (becomes the bar segment / chart bar / legend row etc) without an extra
 * layer that breaks flex/grid sizing. */

type Side = "top" | "bottom";

interface TooltipProps {
  label: string;
  tone?: string;
  hint?: string;
  side?: Side;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  // Allow forwarding data-* (e.g. data-metric, data-peak).
  [key: `data-${string}`]: string | number | boolean | undefined;
}

export function Tooltip({
  label,
  tone,
  hint,
  side = "top",
  className,
  style,
  children,
  ...rest
}: TooltipProps) {
  const [show, setShow] = useState(false);
  return (
    <div
      className={["sp-tip-wrap", className].filter(Boolean).join(" ")}
      style={style}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      {...rest}
    >
      {children}
      {show && (
        <span className="sp-tip" data-side={side} role="tooltip">
          <span className="sp-tip-row">
            {tone && <span className="sp-tip-dot" style={{ background: tone }} />}
            <span className="sp-tip-label">{label}</span>
          </span>
          {hint && <span className="sp-tip-hint">{hint}</span>}
        </span>
      )}
    </div>
  );
}
