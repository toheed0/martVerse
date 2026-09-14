"use client";

import { useState } from "react";
import api, { getErrorMessage } from "@/lib/api";
import Alert from "@/components/ui/Alert";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError(null);

    try {
      // Signing up twice is an upsert on the server, so a second submit is a
      // no-op rather than something this has to guard against.
      const { data } = await api.post("/newsletter", { email });

      setMessage(data.message);
      setEmail("");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
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

        {message ? (
          <p className="mt-8 rounded-full border border-pine/20 bg-pine/10 px-6 py-3 text-sm font-medium text-pine">
            {message}
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
              disabled={saving}
              className="h-12 rounded-full bg-ink px-7 text-sm font-semibold text-canvas transition-colors hover:bg-pine disabled:opacity-50"
            >
              {saving ? "Adding..." : "Subscribe"}
            </button>
          </form>
        )}

        {error ? (
          <div className="mx-auto mt-4 max-w-md text-left">
            <Alert type="error">{error}</Alert>
          </div>
        ) : null}
      </div>
    </section>
  );
}
