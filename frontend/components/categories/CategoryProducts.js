"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategoryProducts } from "@/store/slices/productSlice";
import ProductCard from "@/components/products/ProductCard";
import ProductArt from "@/components/home/ProductArt";
import { ArrowIcon, BagIcon } from "@/components/ui/icons";

const PREVIEW_LIMIT = 8;

export default function CategoryProducts({ category }) {
  const dispatch = useDispatch();
  const { categoryItems, categoryTotal, categoryStatus, categoryError } =
    useSelector((state) => state.products);

  const categoryId = category?._id;

  useEffect(() => {
    if (categoryId) {
      dispatch(fetchCategoryProducts({ categoryId, limit: PREVIEW_LIMIT }));
    }
  }, [categoryId, dispatch]);

  if (categoryStatus === "loading" || categoryStatus === "idle") {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-sand" />
        ))}
      </div>
    );
  }

  if (categoryStatus === "failed") {
    return (
      <div className="rounded-2xl border border-clay/30 bg-clay/5 px-6 py-10 text-center">
        <p className="font-display text-lg font-semibold text-ink">
          Couldn&apos;t load products
        </p>
        <p className="mt-2 text-sm text-muted">{categoryError}</p>
      </div>
    );
  }

  if (categoryItems.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sand text-pine">
          <BagIcon className="h-6 w-6" />
        </span>
        <p className="mt-5 font-display text-2xl font-semibold text-ink">
          No products in {category.name} yet
        </p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Nothing has been listed here so far. Check back once vendors start
          filling this category.
        </p>
        <div className="mt-8 opacity-40">
          <ProductArt name="bag" className="h-24 w-24 text-pine" />
        </div>
        <Link
          href="/products"
          className="group mt-8 flex items-center gap-2 text-sm font-semibold text-ink"
        >
          Browse everything instead
          <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">
          {categoryTotal === 1 ? "1 product" : `${categoryTotal} products`}
        </h2>

        {categoryTotal > categoryItems.length ? (
          <Link
            href={`/products?categoryId=${category._id}`}
            className="group flex items-center gap-2 text-sm font-semibold text-ink"
          >
            View all
            <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        ) : null}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categoryItems.map((product, index) => (
          <ProductCard key={product._id} product={product} index={index} />
        ))}
      </div>
    </>
  );
}
