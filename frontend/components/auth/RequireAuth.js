"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

// Wraps any page that only makes sense for a signed-in user.
export default function RequireAuth({ children }) {
  const router = useRouter();
  const { isAuthenticated, bootstrapped } = useSelector((state) => state.auth);

  useEffect(() => {
    // Only redirect once the session check has actually finished — otherwise
    // we'd bounce a logged-in user out on every reload.
    if (bootstrapped && !isAuthenticated) {
      router.replace("/login");
    }
  }, [bootstrapped, isAuthenticated, router]);

  if (!bootstrapped) {
    return (
      <div className="flex flex-1 items-center justify-center py-32">
        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-pine" />
          Loading your account...
        </div>
      </div>
    );
  }

  // Redirect is already queued; render nothing rather than a flash of content.
  if (!isAuthenticated) return null;

  return children;
}
