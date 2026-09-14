"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import {
  clearCart,
  fetchCart,
  removeCartItem,
  selectCartCount,
  selectCartTotal,
  updateCartItem,
} from "@/store/slices/cartSlice";
import ProductImage from "@/components/products/ProductImage";
import ProductArt from "@/components/home/ProductArt";
import Alert from "@/components/ui/Alert";
import { ArrowIcon } from "@/components/ui/icons";
import { formatPrice } from "@/lib/format";

export default function CartView() {
  const dispatch = useDispatch();
  const { items, status, error, pendingId, clearing, actionError } =
    useSelector((state) => state.cart);
  const count = useSelector(selectCartCount);
  const total = useSelector(selectCartTotal);

  useEffect(() => {
    if (status === "idle") dispatch(fetchCart());
  }, [status, dispatch]);

  // The backend refuses the whole order if any line is no longer active, so
  // block the button rather than send a request that is certain to fail.
  const hasUnavailable = items.some(
    (item) => item.productId.status !== "active"
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12 lg:px-8 lg:py-16">
      <p className="eyebrow text-brass">Your bag</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Shopping bag
      </h1>
      <p className="mt-3 text-muted">
        {status === "succeeded"
          ? count === 0
            ? "Nothing in here yet"
            : `${count} ${count === 1 ? "item" : "items"}`
          : "Loading..."}
      </p>

      <div className="mt-10 space-y-3">
        <Alert type="error">{actionError}</Alert>

        {status === "loading" || status === "idle" ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-sand" />
          ))
        ) : status === "failed" ? (
          <div className="rounded-2xl border border-clay/30 bg-clay/5 px-6 py-10 text-center">
            <p className="font-display text-lg font-semibold text-ink">
              Couldn&apos;t load your bag
            </p>
            <p className="mt-2 text-sm text-muted">{error}</p>
            <button
              type="button"
              onClick={() => dispatch(fetchCart())}
              className="mt-6 h-11 rounded-full bg-pine px-6 text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-20 text-center">
            <div className="opacity-40">
              <ProductArt name="bag" className="h-24 w-24 text-pine" />
            </div>
            <p className="mt-6 font-display text-2xl font-semibold text-ink">
              Your bag is empty
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
              Once you add something it stays here, on every device you sign in
              from.
            </p>
            <Link
              href="/products"
              className="group mt-8 flex items-center gap-2 text-sm font-semibold text-ink"
            >
              Start browsing
              <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        ) : (
          items.map((item) => {
            const product = item.productId;

            // The service drops lines whose product no longer exists, so the
            // only bad state left here is one the vendor took down. It can't be
            // bought, but it still needs a Remove button.
            const unavailable = product.status !== "active";
            const isBusy = pendingId === product._id;

            return (
              <div
                key={product._id}
                className={`flex flex-col gap-4 rounded-2xl border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between ${
                  unavailable ? "border-dashed border-line" : "border-line"
                }`}
              >
                <div
                  className={`flex min-w-0 items-center gap-4 ${
                    unavailable ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-sand text-pine">
                    <ProductImage product={product} artClassName="h-12 w-12" />
                  </div>

                  <div className="min-w-0">
                    <Link
                      href={`/products/${product._id}`}
                      className="font-display text-lg font-semibold text-ink hover:text-pine"
                    >
                      {product.name}
                    </Link>

                    <p className="mt-1 text-sm text-muted">
                      {unavailable ? (
                        <span className="text-clay">
                          Taken off the storefront
                        </span>
                      ) : (
                        <>
                          {formatPrice(product.price)}
                          {product.stock <= 5 ? (
                            <span className="text-clay">
                              {" · "}
                              only {product.stock} left
                            </span>
                          ) : null}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-4">
                  {!unavailable ? (
                    <>
                      <div className="flex h-11 items-center rounded-full border border-line">
                        <button
                          type="button"
                          disabled={isBusy || item.quantity <= 1}
                          aria-label={`Decrease quantity of ${product.name}`}
                          onClick={() =>
                            dispatch(
                              updateCartItem({
                                productId: product._id,
                                quantity: item.quantity - 1,
                              })
                            )
                          }
                          className="flex h-11 w-10 items-center justify-center rounded-l-full text-ink transition-colors hover:bg-ink/5 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          &minus;
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-ink">
                          {isBusy ? "·" : item.quantity}
                        </span>
                        <button
                          type="button"
                          disabled={isBusy || item.quantity >= product.stock}
                          aria-label={`Increase quantity of ${product.name}`}
                          onClick={() =>
                            dispatch(
                              updateCartItem({
                                productId: product._id,
                                quantity: item.quantity + 1,
                              })
                            )
                          }
                          className="flex h-11 w-10 items-center justify-center rounded-r-full text-ink transition-colors hover:bg-ink/5 disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          +
                        </button>
                      </div>

                      <p className="w-24 text-right text-sm font-semibold text-ink">
                        {formatPrice(product.price * item.quantity)}
                      </p>
                    </>
                  ) : null}

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => dispatch(removeCartItem(product._id))}
                    className="h-11 rounded-full px-4 text-sm font-semibold text-clay transition-colors hover:bg-clay/10 disabled:opacity-50"
                  >
                    {isBusy ? "Working..." : "Remove"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {status === "succeeded" && items.length > 0 ? (
        <div className="mt-10 rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted">
                Subtotal
              </p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink">
                {formatPrice(total)}
              </p>
            </div>

            <button
              type="button"
              disabled={clearing}
              onClick={() => dispatch(clearCart())}
              className="h-11 rounded-full px-5 text-sm font-semibold text-clay transition-colors hover:bg-clay/10 disabled:opacity-50"
            >
              {clearing ? "Clearing..." : "Clear bag"}
            </button>
          </div>

          {/* A disabled <Link> is still a working link, so the unavailable
              case renders as a plain button that goes nowhere. */}
          {hasUnavailable ? (
            <button
              type="button"
              disabled
              className="mt-6 flex h-14 w-full cursor-not-allowed items-center justify-center rounded-full bg-pine text-sm font-semibold text-canvas opacity-50"
            >
              Checkout
            </button>
          ) : (
            <Link
              href="/checkout"
              className="mt-6 flex h-14 w-full items-center justify-center rounded-full bg-pine text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft"
            >
              Checkout
            </Link>
          )}

          <p className="mt-3 text-center text-xs text-muted">
            {hasUnavailable
              ? "Remove the unavailable item before checking out."
              : "Next: where it goes and how you want to pay."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
