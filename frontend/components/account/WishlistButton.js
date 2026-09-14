"use client";

import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { addToWishlist, removeFromWishlist } from "@/store/slices/accountSlice";

const HeartIcon = ({ filled, className = "h-5 w-5" }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M12 20s-7-4.4-7-9.3A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7 2.7C19 15.6 12 20 12 20Z" />
  </svg>
);

// The wishlist lives on the account, so there is nowhere to put one before a
// buyer signs in. Rather than hide the heart, an unauthenticated tap sends them
// to sign in — hiding it would leave them wondering where the feature went.
export default function WishlistButton({
  productId,
  className = "",
  size = "h-10 w-10",
}) {
  const dispatch = useDispatch();
  const router = useRouter();

  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { wishlist, wishlistPendingId } = useSelector((state) => state.account);

  // Vendors and admins have no cart and no wishlist — /api/account would take
  // the call, but a shelf of saved items means nothing to them.
  if (isAuthenticated && user?.role !== "buyer") return null;

  const saved = wishlist.some((item) => item._id === productId);
  const busy = wishlistPendingId === productId;

  const handleClick = (event) => {
    // Hearts sit on top of product cards, which are themselves links.
    event.preventDefault();
    event.stopPropagation();

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    dispatch(saved ? removeFromWishlist(productId) : addToWishlist(productId));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      title={saved ? "Remove from wishlist" : "Save to wishlist"}
      className={`flex ${size} items-center justify-center rounded-full transition-colors disabled:opacity-50 ${
        saved
          ? "bg-clay/10 text-clay hover:bg-clay/20"
          : "bg-surface/80 text-ink backdrop-blur-sm hover:bg-surface hover:text-clay"
      } ${className}`}
    >
      <HeartIcon filled={saved} />
    </button>
  );
}
