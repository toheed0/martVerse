"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthFeedback, forgotPassword } from "@/store/slices/authSlice";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import { ArrowIcon } from "@/components/ui/icons";

export default function ForgotPasswordPage() {
  const dispatch = useDispatch();
  const { loading, error, successMessage } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");

  // Clear anything the login page left behind.
  useEffect(() => {
    dispatch(clearAuthFeedback());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(forgotPassword(email));
  };

  // The server answers identically for a known and an unknown address, so this
  // screen must not imply the mail definitely went somewhere — it says what was
  // done, not what exists.
  if (successMessage) {
    return (
      <div>
        <p className="eyebrow text-brass">Check your inbox</p>
        <h1 className="mt-3 font-display text-4xl leading-tight font-semibold tracking-tight text-ink">
          On its way
        </h1>

        <div className="mt-6">
          <Alert type="success">{successMessage}</Alert>
        </div>

        <p className="mt-6 leading-relaxed text-muted">
          The link works for 30 minutes. If nothing arrives, check the spam
          folder before asking for another one.
        </p>

        <Link
          href="/login"
          className="group mt-8 flex items-center gap-2 text-sm font-semibold text-ink"
        >
          Back to sign in
          <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow text-brass">Locked out</p>
      <h1 className="mt-3 font-display text-4xl leading-tight font-semibold tracking-tight text-ink">
        Reset your password
      </h1>
      <p className="mt-3 text-muted">
        Enter the address you signed up with and we&apos;ll send a link to
        choose a new password.
      </p>

      <form onSubmit={handleSubmit} className="mt-9 space-y-5">
        <Alert type="error">{error}</Alert>

        <Input
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? "Sending..." : "Send reset link"}
          {loading ? null : <ArrowIcon className="h-4 w-4" />}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-semibold text-ink underline underline-offset-4 hover:text-pine"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
