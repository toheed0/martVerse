"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "@/store/slices/categorySlice";
import CategoryCard from "./CategoryCard";

export default function CategoryGrid({ limit }) {
  const dispatch = useDispatch();
  const { items, listStatus, listError } = useSelector(
    (state) => state.categories
  );

  useEffect(() => {
    // Only fetch once — the home page and /categories share this state.
    if (listStatus === "idle") {
      dispatch(fetchCategories());
    }
  }, [listStatus, dispatch]);

  if (listStatus === "loading" || listStatus === "idle") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: limit || 6 }).map((_, i) => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-sand" />
        ))}
      </div>
    );
  }

  if (listStatus === "failed") {
    return (
      <div className="rounded-2xl border border-clay/30 bg-clay/5 px-6 py-10 text-center">
        <p className="font-display text-lg font-semibold text-ink">
          Couldn&apos;t load categories
        </p>
        <p className="mt-2 text-sm text-muted">{listError}</p>
        <button
          type="button"
          onClick={() => dispatch(fetchCategories())}
          className="mt-6 h-11 rounded-full bg-pine px-6 text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft"
        >
          Try again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
        <p className="font-display text-lg font-semibold text-ink">
          No categories yet
        </p>
        <p className="mt-2 text-sm text-muted">
          Once an admin adds categories they&apos;ll appear here.
        </p>
      </div>
    );
  }

  const visible = limit ? items.slice(0, limit) : items;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((category, index) => (
          <CategoryCard key={category._id} category={category} index={index} />
        ))}
      </div>

      {limit && items.length > limit ? (
        <div className="mt-8 text-center">
          <Link
            href="/categories"
            className="inline-flex h-12 items-center rounded-full border border-ink/20 px-7 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink/5"
          >
            View all {items.length} categories
          </Link>
        </div>
      ) : null}
    </>
  );
}
