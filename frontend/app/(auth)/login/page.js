"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthFeedback, login } from "@/store/slices/authSlice";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import { ArrowIcon } from "@/components/ui/icons";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { loading, error, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const [form, setForm] = useState({ email: "", password: "" });

  // Clear any message left over from the register page.
  useEffect(() => {
    dispatch(clearAuthFeedback());
  }, [dispatch]);

  // Someone already signed in has no reason to be here.
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(form));
  };

  return (
    <div>
      <p className="eyebrow text-brass">Welcome back</p>
      <h1 className="mt-3 font-display text-4xl leading-tight font-semibold tracking-tight text-ink">
        Sign in to MartVerse
      </h1>
      <p className="mt-3 text-muted">
        New here?{" "}
        <Link
          href="/register"
          className="font-semibold text-ink underline underline-offset-4 hover:text-pine"
        >
          Create an account
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-9 space-y-5">
        <Alert type="error">{error}</Alert>

        <Input
          id="email"
          name="email"
          type="email"
          label="Email address"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />

        <div>
          <Input
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            required
          />
          <div className="mt-2 text-right">
            <Link href="/login" className="text-xs text-muted hover:text-ink">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? "Signing in..." : "Sign in"}
          {loading ? null : <ArrowIcon className="h-4 w-4" />}
        </Button>
      </form>

      <p className="mt-8 text-center text-xs leading-relaxed text-muted">
        By signing in you agree to our{" "}
        <Link href="/" className="underline underline-offset-2">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
