"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { ShieldIcon } from "@/components/ui/icons";

// Frontend mirror of the backend's requireRole middleware. This only hides UI —
// the API still enforces the real check, so a determined user gains nothing.
export default function RequireRole({ roles, children }) {
  const router = useRouter();
  const { user, isAuthenticated, bootstrapped } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (bootstrapped && !isAuthenticated) {
      router.replace("/login");
    }
  }, [bootstrapped, isAuthenticated, router]);

  if (!bootstrapped) {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-pine" />
          Checking permissions...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Signed in, wrong role — say so instead of bouncing them somewhere random.
  if (!roles.includes(user.role)) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-24">
        <div className="max-w-sm text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-clay/10 text-clay">
            <ShieldIcon className="h-6 w-6" />
          </span>
          <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink">
            Not authorised
          </h1>
          <p className="mt-3 leading-relaxed text-muted">
            This area is for {roles.join(" and ")} accounts. You&apos;re signed
            in as a {user.role}.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-pine px-7 text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft"
          >
            Back to store
          </Link>
        </div>
      </div>
    );
  }

  return children;
}
