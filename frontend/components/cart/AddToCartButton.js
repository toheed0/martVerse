"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, clearCartFeedback } from "@/store/slices/cartSlice";
import Alert from "@/components/ui/Alert";
import { BagIcon } from "@/components/ui/icons";

const buttonClass =
  "flex h-14 items-center justify-center gap-2 rounded-full bg-pine px-10 text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft disabled:cursor-not-allowed disabled:opacity-50";

export default function AddToCartButton({ product }) {
  const dispatch = useDispatch();
  const { user, isAuthenticated, bootstrapped } = useSelector(
    (state) => state.auth
  );
  const { pendingId, actionError, lastAddedId } = useSelector(
    (state) => state.cart
  );

  const [quantity, setQuantity] = useState(1);

  // Any feedback left over from the last product would otherwise read as if it
  // belonged to this one.
  useEffect(() => {
    dispatch(clearCartFeedback());
  }, [dispatch, product._id]);

  const soldOut = product.stock <= 0;
  const isBusy = pendingId === product._id;
  const justAdded = lastAddedId === product._id;

  if (soldOut) {
    return (
      <button type="button" disabled className={`mt-8 w-full sm:w-auto ${buttonClass}`}>
        Sold out
      </button>
    );
  }

  // Nothing is rendered until the session check finishes, so this never flashes
  // "Sign in" at someone who is already signed in.
  if (!bootstrapped) {
    return <div className="mt-8 h-14 w-full animate-pulse rounded-full bg-sand sm:w-56" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="mt-8">
        <Link href="/login" className={`w-full sm:w-auto ${buttonClass}`}>
          <BagIcon className="h-4 w-4" />
          Sign in to buy
        </Link>
        <p className="mt-3 text-xs text-muted">
          You need a buyer account to add things to a bag.
        </p>
      </div>
    );
  }

  // Vendors and admins have no cart on the backend, so offering the button
  // would only produce a 403.
  if (user.role !== "buyer") {
    return (
      <div className="mt-8">
        <button type="button" disabled className={`w-full sm:w-auto ${buttonClass}`}>
          Add to bag
        </button>
        <p className="mt-3 text-xs text-muted">
          You&apos;re signed in as a {user.role}. Shopping needs a buyer
          account.
        </p>
      </div>
    );
  }

  const handleAdd = () => dispatch(addToCart({ productId: product._id, quantity }));

  return (
    <div className="mt-8 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex h-14 items-center rounded-full border border-line bg-surface">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            className="flex h-14 w-12 items-center justify-center rounded-l-full text-lg text-ink transition-colors hover:bg-ink/5 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            &minus;
          </button>
          <span
            aria-live="polite"
            className="w-10 text-center text-sm font-semibold text-ink"
          >
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
            disabled={quantity >= product.stock}
            aria-label="Increase quantity"
            className="flex h-14 w-12 items-center justify-center rounded-r-full text-lg text-ink transition-colors hover:bg-ink/5 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={isBusy}
          className={`flex-1 sm:flex-none ${buttonClass}`}
        >
          <BagIcon className="h-4 w-4" />
          {isBusy ? "Adding..." : "Add to bag"}
        </button>
      </div>

      <Alert type="error">{actionError}</Alert>

      {justAdded && !actionError ? (
        <p className="text-sm text-pine">
          Added to your bag.{" "}
          <Link href="/cart" className="font-semibold underline">
            View bag
          </Link>
        </p>
      ) : null}
    </div>
  );
}
