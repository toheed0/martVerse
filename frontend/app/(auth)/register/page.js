"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { clearAuthFeedback, register } from "@/store/slices/authSlice";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import { ArrowIcon, ShieldIcon } from "@/components/ui/icons";

const roles = [
  {
    value: "buyer",
    title: "I'm a buyer",
    text: "Shop from vetted vendors.",
  },
  {
    value: "vendor",
    title: "I'm a vendor",
    text: "Sell your products here.",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { loading, error, successMessage, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "buyer",
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    dispatch(clearAuthFeedback());
  }, [dispatch]);

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

    // Catch the obvious problems here so we don't waste a request.
    if (form.password.length < 6) {
      setFormError("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setFormError("");

    dispatch(
      register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      })
    );
  };

  // The backend does not log you in on register — vendors still need
  // approval — so we confirm and send them to the login page.
  if (successMessage) {
    return (
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pine/10 text-pine">
          <ShieldIcon className="h-6 w-6" />
        </span>
        <h1 className="mt-6 font-display text-3xl leading-tight font-semibold tracking-tight text-ink">
          {successMessage}
        </h1>
        <p className="mt-4 leading-relaxed text-muted">
          {form.role === "vendor"
            ? "We review every vendor before they go live. You'll get an email once your store is approved."
            : "Your account is ready. Sign in to start shopping."}
        </p>
        <div className="mt-8">
          <Button href="/login" size="lg" className="w-full">
            Continue to sign in
            <ArrowIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow text-brass">Get started</p>
      <h1 className="mt-3 font-display text-4xl leading-tight font-semibold tracking-tight text-ink">
        Create your account
      </h1>
      <p className="mt-3 text-muted">
        Already have one?{" "}
        <Link
          href="/login"
          className="font-semibold text-ink underline underline-offset-4 hover:text-pine"
        >
          Sign in
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="mt-9 space-y-5">
        <Alert type="error">{formError || error}</Alert>

        <fieldset>
          <legend className="mb-3 block text-xs font-semibold tracking-[0.12em] uppercase text-muted">
            Account type
          </legend>
          <div className="grid grid-cols-2 gap-3">
            {roles.map((role) => (
              <label
                key={role.value}
                className={`cursor-pointer rounded-xl border p-4 transition-colors ${
                  form.role === role.value
                    ? "border-pine bg-pine/5"
                    : "border-line bg-surface hover:border-ink/30"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={form.role === role.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className="block text-sm font-semibold text-ink">
                  {role.title}
                </span>
                <span className="mt-1 block text-xs leading-snug text-muted">
                  {role.text}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Input
          id="name"
          name="name"
          label="Full name"
          placeholder="Ayesha Khan"
          value={form.name}
          onChange={handleChange}
          autoComplete="name"
          required
        />

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

        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="At least 6 characters"
          value={form.password}
          onChange={handleChange}
          autoComplete="new-password"
          required
        />

        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm password"
          placeholder="Repeat your password"
          value={form.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
          required
        />

        <Button type="submit" size="lg" disabled={loading} className="w-full">
          {loading ? "Creating account..." : "Create account"}
          {loading ? null : <ArrowIcon className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
