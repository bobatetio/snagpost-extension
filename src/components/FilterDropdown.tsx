import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FilterType } from "../lib/facebook/types";

const OPTIONS: { id: FilterType; label: string }[] = [
  { id: "all",       label: "All types" },
  { id: "video",     label: "Video" },
  { id: "slideshow", label: "Slideshow" },
  { id: "carousel",  label: "Carousel" },
  { id: "photo",     label: "Photo" },
  { id: "link",      label: "Link" },
];

interface FilterDropdownProps {
  value: FilterType;
  onChange: (next: FilterType) => void;
}

export function FilterDropdown({ value, onChange }: FilterDropdownProps) {
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
        data-tone={value === "all" ? undefined : value}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {value !== "all" && <span className="tone-dot" data-tone={value} />}
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
              {o.id !== "all" && <span className="tone-dot" data-tone={o.id} />}
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
