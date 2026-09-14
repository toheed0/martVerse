"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { fetchWishlist, removeFromWishlist } from "@/store/slices/accountSlice";
import ProductImage from "@/components/products/ProductImage";
import ProductArt from "@/components/home/ProductArt";
import AddToCartButton from "@/components/cart/AddToCartButton";
import Alert from "@/components/ui/Alert";
import { ArrowIcon } from "@/components/ui/icons";
import { formatPrice } from "@/lib/format";

export default function WishlistView() {
  const dispatch = useDispatch();
  const { wishlist, wishlistStatus, wishlistError, wishlistPendingId } =
    useSelector((state) => state.account);

  useEffect(() => {
    if (wishlistStatus === "idle") dispatch(fetchWishlist());
  }, [wishlistStatus, dispatch]);

  const loading = wishlistStatus === "idle" || wishlistStatus === "loading";

  return (
    <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-semibold text-ink">
          Saved items
        </h2>
        {wishlistStatus === "succeeded" && wishlist.length > 0 ? (
          <p className="text-sm text-muted">
            {wishlist.length} {wishlist.length === 1 ? "item" : "items"}
          </p>
        ) : null}
      </div>

      <div className="mt-6 space-y-3">
        <Alert type="error">{wishlistError}</Alert>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-sand" />
          ))
        ) : wishlist.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-line px-6 py-16 text-center">
            <div className="opacity-40">
              <ProductArt name="bag" className="h-20 w-20 text-pine" />
            </div>
            <p className="mt-5 font-display text-xl font-semibold text-ink">
              Nothing saved yet
            </p>
            <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted">
              Tap the heart on anything you want to come back to.
            </p>
            <Link
              href="/products"
              className="group mt-6 flex items-center gap-2 text-sm font-semibold text-ink"
            >
              Start browsing
              <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        ) : (
          wishlist.map((product) => {
            // The list holds references, not snapshots — so a product can go
            // off sale while it is sitting here.
            const unavailable = product.status !== "active";
            const soldOut = product.stock <= 0;
            const busy = wishlistPendingId === product._id;

            return (
              <div
                key={product._id}
                className={`flex flex-col gap-4 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between ${
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
                          {soldOut ? (
                            <span className="text-clay">{" · "}Sold out</span>
                          ) : product.stock <= 5 ? (
                            <span className="text-clay">
                              {" · "}only {product.stock} left
                            </span>
                          ) : null}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {!unavailable && !soldOut ? (
                    <AddToCartButton product={product} />
                  ) : null}

                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => dispatch(removeFromWishlist(product._id))}
                    className="h-11 rounded-full px-4 text-sm font-semibold text-clay transition-colors hover:bg-clay/10 disabled:opacity-50"
                  >
                    {busy ? "Working..." : "Remove"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
