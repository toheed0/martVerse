"use client";

import { useSelector } from "react-redux";
import Button from "@/components/ui/Button";
import { ArrowIcon } from "@/components/ui/icons";

// Split out of Hero so the rest of the section stays a Server Component —
// only these buttons need the store, so only they ship JavaScript.
export default function HeroActions() {
  const { isAuthenticated, bootstrapped } = useSelector((state) => state.auth);

  return (
    <div className="mt-10 flex flex-wrap items-center gap-3">
      <Button href={isAuthenticated ? "/products" : "/register"} size="lg">
        Start shopping
        <ArrowIcon className="h-4 w-4" />
      </Button>

      {/* The access token lives in memory, so on first paint we don't yet know
          if there's a session. Hold the space until restoreSession answers,
          otherwise "Sign in" flashes for users who are already logged in. */}
      {!bootstrapped ? (
        <div className="h-14 w-32 animate-pulse rounded-full bg-sand" />
      ) : isAuthenticated ? null : (
        <Button href="/login" variant="outline" size="lg">
          Sign in
        </Button>
      )}
    </div>
  );
}
