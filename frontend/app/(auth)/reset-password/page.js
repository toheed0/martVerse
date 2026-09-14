"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthFeedback, resetPassword } from "@/store/slices/authSlice";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import { ArrowIcon } from "@/components/ui/icons";

// Kept in step with MIN_PASSWORD_LENGTH in authService.js. The server is what
// enforces it — this only saves a round trip to be told the obvious.
const MIN_PASSWORD_LENGTH = 6;

function ResetPasswordForm() {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { loading, error, successMessage } = useSelector((state) => state.auth);

  const [form, setForm] = useState({ password: "", confirm: "" });
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    dispatch(clearAuthFeedback());
  }, [dispatch]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setLocalError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (form.password.length < MIN_PASSWORD_LENGTH) {
      setLocalError(
        `Password must be at least ${MIN_PASSWORD_LENGTH} characters`
      );
      return;
    }

    // Only checked here. The server never sees the second box — it has no way
    // to know what the buyer meant to type, only what they sent.
    if (form.password !== form.confirm) {
      setLocalError("The two passwords do not match");
      return;
    }

    dispatch(resetPassword({ token, password: form.password }));
  };

  // Someone opened /reset-password directly, or the link lost its query string
  // on the way through a mail client.
  if (!token) {
    return (
      <div>
        <p className="eyebrow text-clay">Something is missing</p>
        <h1 className="mt-3 font-display text-4xl leading-tight font-semibold tracking-tight text-ink">
          This link is incomplete
        </h1>
        <p className="mt-3 leading-relaxed text-muted">
          Open the link from your email exactly as it was sent, or ask for a new
          one.
        </p>

        <Link
          href="/forgot-password"
          className="group mt-8 flex items-center gap-2 text-sm font-semibold text-ink"
        >
          Send a new link
          <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    );
  }

  if (successMessage) {
    return (
      <div>
        <p className="eyebrow text-brass">All set</p>
        <h1 className="mt-3 font-display text-4xl leading-tight font-semibold tracking-tight text-ink">
          Password changed
        </h1>

        <div className="mt-6">
          <Alert type="success">{successMessage}</Alert>
        </div>

        <p className="mt-6 leading-relaxed text-muted">
          Everywhere that was signed in to this account has been signed out —
          including anyone who should not have been.
        </p>

        <Button href="/login" size="lg" className="mt-8 w-full">
          Sign in
          <ArrowIcon className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow text-brass">Almost done</p>
      <h1 className="mt-3 font-display text-4xl leading-tight font-semibold tracking-tight text-ink">
        Choose a new password
      </h1>
      <p className="mt-3 text-muted">
        Pick something you have not used here before.
      </p>

      <form onSubmit={handleSubmit} className="mt-9 space-y-5">
        <Alert type="error">{localError || error}</Alert>

        <Input
          id="password"
          name="password"
          type="password"
          label="New password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange}
          autoComplete="new-password"
          required
        />

        <Input
          id="confirm"
          name="confirm"
          type="password"
          label="Confirm new password"
          placeholder="••••••••"
          value={form.confirm}
          onChange={handleChange}
          autoComplete="new-password"
          required
        />

        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? "Saving..." : "Change password"}
          {loading ? null : <ArrowIcon className="h-4 w-4" />}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Link expired?{" "}
        <Link
          href="/forgot-password"
          className="font-semibold text-ink underline underline-offset-4 hover:text-pine"
        >
          Ask for a new one
        </Link>
      </p>
    </div>
  );
}

// useSearchParams opts the tree into client-side rendering, and Next needs a
// boundary around it or the build refuses to prerender this route.
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <div className="h-4 w-28 animate-pulse rounded bg-sand" />
          <div className="h-11 w-72 animate-pulse rounded bg-sand" />
          <div className="h-12 w-full animate-pulse rounded-xl bg-sand" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
