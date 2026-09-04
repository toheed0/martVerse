"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "./icons";

export default function Input({ label, id, error, type = "text", ...props }) {
  const [revealed, setRevealed] = useState(false);

  // Every password field gets its own toggle — the pages don't have to wire
  // anything up, and each field reveals independently.
  const isPassword = type === "password";

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-xs font-semibold tracking-[0.12em] uppercase text-muted"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={isPassword && revealed ? "text" : type}
          className={`h-12 w-full rounded-xl border bg-surface pl-4 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-pine ${
            isPassword ? "pr-12" : "pr-4"
          } ${error ? "border-clay" : "border-line"}`}
          {...props}
        />

        {isPassword ? (
          <button
            type="button"
            onClick={() => setRevealed((current) => !current)}
            aria-label={revealed ? "Hide password" : "Show password"}
            aria-pressed={revealed}
            className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-ink/5 hover:text-ink"
          >
            {revealed ? (
              <EyeOffIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        ) : null}
      </div>

      {error ? <p className="text-xs text-clay">{error}</p> : null}
    </div>
  );
}
