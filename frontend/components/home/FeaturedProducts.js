"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { fetchFeaturedProducts } from "@/store/slices/productSlice";
import ProductCard from "@/components/products/ProductCard";
import ProductArt from "./ProductArt";
import { ArrowIcon } from "@/components/ui/icons";

const FEATURED_LIMIT = 4;

// The API returns newest first, so this is the four most recent listings rather
// than a hand-picked set — there is no "featured" flag on a product yet.
export default function FeaturedProducts() {
  const dispatch = useDispatch();
  const { featured, featuredStatus, featuredError } = useSelector(
    (state) => state.products
  );

  useEffect(() => {
    // Only fetch once. A create or edit anywhere resets this back to idle, so
    // the strip picks the change up the next time the home page mounts.
    if (featuredStatus === "idle") {
      dispatch(fetchFeaturedProducts({ limit: FEATURED_LIMIT }));
    }
  }, [featuredStatus, dispatch]);

  return (
    <section className="border-b border-line bg-surface">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-brass">This week</p>
            <h2 className="mt-3 max-w-lg font-display text-4xl leading-tight font-semibold tracking-tight text-ink sm:text-5xl">
              Selected by our editors
            </h2>
          </div>
          <Link
            href="/products"
            className="group flex items-center gap-2 text-sm font-semibold text-ink"
          >
            View all products
            <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-12">
          {featuredStatus === "loading" || featuredStatus === "idle" ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: FEATURED_LIMIT }).map((_, i) => (
                <div key={i}>
                  <div className="h-64 animate-pulse rounded-2xl bg-sand" />
                  <div className="mt-4 h-3 w-24 animate-pulse rounded bg-sand" />
                  <div className="mt-2 h-4 w-40 animate-pulse rounded bg-sand" />
                </div>
              ))}
            </div>
          ) : featuredStatus === "failed" ? (
            <div className="rounded-2xl border border-clay/30 bg-clay/5 px-6 py-10 text-center">
              <p className="font-display text-lg font-semibold text-ink">
                Couldn&apos;t load products
              </p>
              <p className="mt-2 text-sm text-muted">{featuredError}</p>
              <button
                type="button"
                onClick={() =>
                  dispatch(fetchFeaturedProducts({ limit: FEATURED_LIMIT }))
                }
                className="mt-6 h-11 rounded-full bg-pine px-6 text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft"
              >
                Try again
              </button>
            </div>
          ) : featured.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-16 text-center">
              <div className="opacity-40">
                <ProductArt name="vase" className="h-20 w-20 text-pine" />
              </div>
              <p className="mt-6 font-display text-lg font-semibold text-ink">
                Nothing listed yet
              </p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
                The first products land here as soon as our vendors start
                filling their shelves.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featured.map((product, index) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
