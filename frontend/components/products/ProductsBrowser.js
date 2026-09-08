"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "@/store/slices/productSlice";
import ProductCard from "./ProductCard";
import ProductFilters from "./ProductFilters";

const PAGE_SIZE = 12;

// A window of page numbers around the current one, so 40 pages don't render 40
// links.
const pageWindow = (page, totalPages, span = 2) => {
  const start = Math.max(1, Math.min(page - span, totalPages - span * 2));
  const end = Math.min(totalPages, Math.max(page + span, span * 2 + 1));

  const pages = [];
  for (let i = start; i <= end; i += 1) pages.push(i);
  return pages;
};

export default function ProductsBrowser() {
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const { items, pagination, listStatus, listError } = useSelector(
    (state) => state.products
  );

  // Read as primitives so the effect below re-runs on value changes, not on the
  // new searchParams object identity every navigation produces.
  const search = searchParams.get("search") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const minPrice = searchParams.get("minPrice") || undefined;
  const maxPrice = searchParams.get("maxPrice") || undefined;
  const page = Number(searchParams.get("page")) || 1;

  useEffect(() => {
    dispatch(
      fetchProducts({
        page,
        limit: PAGE_SIZE,
        search,
        categoryId,
        minPrice,
        maxPrice,
      })
    );
  }, [dispatch, page, search, categoryId, minPrice, maxPrice]);

  const pageHref = (target) => {
    const next = new URLSearchParams(searchParams.toString());
    if (target === 1) next.delete("page");
    else next.set("page", String(target));

    const query = next.toString();
    return query ? `/products?${query}` : "/products";
  };

  const { totalPages = 0, totalProducts = 0 } = pagination || {};
  const isBusy = listStatus === "loading" || listStatus === "idle";

  return (
    <div className="space-y-8">
      <ProductFilters total={totalProducts} />

      {isBusy ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i}>
              <div className="h-64 animate-pulse rounded-2xl bg-sand" />
              <div className="mt-4 h-3 w-24 animate-pulse rounded bg-sand" />
              <div className="mt-2 h-4 w-40 animate-pulse rounded bg-sand" />
            </div>
          ))}
        </div>
      ) : listStatus === "failed" ? (
        <div className="rounded-2xl border border-clay/30 bg-clay/5 px-6 py-14 text-center">
          <p className="font-display text-lg font-semibold text-ink">
            Couldn&apos;t load products
          </p>
          <p className="mt-2 text-sm text-muted">{listError}</p>
          <button
            type="button"
            onClick={() =>
              dispatch(
                fetchProducts({
                  page,
                  limit: PAGE_SIZE,
                  search,
                  categoryId,
                  minPrice,
                  maxPrice,
                })
              )
            }
            className="mt-6 h-11 rounded-full bg-pine px-6 text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft"
          >
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-6 py-20 text-center">
          <p className="font-display text-xl font-semibold text-ink">
            Nothing matches those filters
          </p>
          <p className="mt-2 text-sm text-muted">
            Try a broader price range, or clear the search.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((product, index) => (
              <ProductCard
                key={product._id}
                product={product}
                index={index}
              />
            ))}
          </div>

          {totalPages > 1 ? (
            <nav
              aria-label="Pagination"
              className="flex flex-wrap items-center justify-center gap-2 pt-4"
            >
              {page > 1 ? (
                <Link
                  href={pageHref(page - 1)}
                  scroll={false}
                  className="flex h-10 items-center rounded-full border border-ink/20 px-5 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink/5"
                >
                  Previous
                </Link>
              ) : null}

              {pageWindow(page, totalPages).map((target) => (
                <Link
                  key={target}
                  href={pageHref(target)}
                  scroll={false}
                  aria-current={target === page ? "page" : undefined}
                  className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold transition-colors ${
                    target === page
                      ? "bg-pine text-canvas"
                      : "border border-line text-muted hover:border-ink/30 hover:text-ink"
                  }`}
                >
                  {target}
                </Link>
              ))}

              {page < totalPages ? (
                <Link
                  href={pageHref(page + 1)}
                  scroll={false}
                  className="flex h-10 items-center rounded-full border border-ink/20 px-5 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink/5"
                >
                  Next
                </Link>
              ) : null}
            </nav>
          ) : null}
        </>
      )}
    </div>
  );
}
