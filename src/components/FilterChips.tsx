import type { FilterType } from "../lib/facebook/types";

const FILTERS: { id: FilterType; label: string; tone: FilterType }[] = [
  { id: "all",       label: "All",       tone: "all" },
  { id: "video",     label: "Video",     tone: "video" },
  { id: "slideshow", label: "Slideshow", tone: "slideshow" },
  { id: "carousel",  label: "Carousel",  tone: "carousel" },
  { id: "photo",     label: "Photo",     tone: "photo" },
  { id: "link",      label: "Link",      tone: "link" },
];

interface FilterChipsProps {
  value: FilterType;
  onChange: (next: FilterType) => void;
}

export function FilterChips({ value, onChange }: FilterChipsProps) {
  return (
    <div className="filter-chips" role="radiogroup" aria-label="Filter posts by type">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          type="button"
          role="radio"
          aria-checked={value === f.id}
          className="filter-chip"
          data-tone={f.tone}
          data-active={value === f.id}
          onClick={() => onChange(f.id)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
