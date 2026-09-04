"use client";

import { useState } from "react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // No newsletter endpoint on the backend yet, so just confirm locally.
    setSubscribed(true);
    setEmail("");
  };

  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-2xl px-5 py-20 text-center lg:py-24">
        <p className="eyebrow text-brass">Stay in the loop</p>
        <h2 className="mt-4 font-display text-3xl leading-tight font-semibold tracking-tight text-ink sm:text-4xl">
          New arrivals, once a week.
        </h2>
        <p className="mt-4 leading-relaxed text-muted">
          A short note on what just landed and the makers behind it. No spam,
          unsubscribe anytime.
        </p>

        {subscribed ? (
          <p className="mt-8 rounded-full border border-pine/20 bg-pine/10 px-6 py-3 text-sm font-medium text-pine">
            You&apos;re on the list. Look out for Thursday&apos;s edit.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
              className="h-12 flex-1 rounded-full border border-line bg-surface px-5 text-sm text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-pine"
            />
            <button
              type="submit"
              className="h-12 rounded-full bg-ink px-7 text-sm font-semibold text-canvas transition-colors hover:bg-pine"
            >
              Subscribe
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
