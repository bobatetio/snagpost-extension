import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { SortOrder } from "../lib/facebook/types";

const OPTIONS: { id: SortOrder; label: string }[] = [
  { id: "recent",   label: "Most recent" },
  { id: "likes",    label: "Most likes" },
  { id: "comments", label: "Most comments" },
  { id: "shares",   label: "Most shares" },
];

interface SortDropdownProps {
  value: SortOrder;
  onChange: (next: SortOrder) => void;
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = OPTIONS.find((o) => o.id === value) ?? OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="sort-dropdown" ref={ref}>
      <button
        type="button"
        className="sort-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{active.label}</span>
        <ChevronDown size={14} strokeWidth={1.75} />
      </button>
      {open && (
        <div className="sort-menu" role="listbox">
          {OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              role="option"
              aria-selected={o.id === value}
              className="sort-option"
              data-active={o.id === value}
              onClick={() => {
                onChange(o.id);
                setOpen(false);
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
