"use client";

import { useState } from "react";
import { StarIcon } from "@/components/ui/icons";

const VALUES = [1, 2, 3, 4, 5];

// Read-only stars. Half steps are shown by clipping a filled star over an empty
// one rather than drawing a third icon, so 4.3 reads as four and a bit.
export function Stars({ value = 0, className = "h-4 w-4" }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {VALUES.map((star) => {
        // How much of THIS star is filled: all of it, none, or the remainder.
        const fill = Math.max(0, Math.min(1, value - (star - 1)));

        return (
          <span key={star} className="relative inline-block">
            <StarIcon className={`${className} text-line`} />

            {fill > 0 ? (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <StarIcon className={`${className} text-brass`} />
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}

// The version you can click. Hovering previews the rating so a mis-tap is
// obvious before it is committed.
export function StarInput({ value, onChange, disabled = false }) {
  const [hovered, setHovered] = useState(0);

  const shown = hovered || value;

  return (
    <div
      className="inline-flex items-center gap-1"
      onMouseLeave={() => setHovered(0)}
      role="radiogroup"
      aria-label="Rating"
    >
      {VALUES.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
          disabled={disabled}
          onMouseEnter={() => setHovered(star)}
          onFocus={() => setHovered(star)}
          onClick={() => onChange(star)}
          className="rounded p-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <StarIcon
            className={`h-7 w-7 ${star <= shown ? "text-brass" : "text-line"}`}
          />
        </button>
      ))}
    </div>
  );
}
