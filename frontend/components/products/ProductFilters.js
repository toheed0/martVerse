"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategories } from "@/store/slices/categorySlice";
import { SearchIcon } from "@/components/ui/icons";

// Long enough that typing a word is one request, short enough to feel live.
const DEBOUNCE_MS = 400;

const fieldClass =
  "h-12 w-full rounded-xl border border-line bg-surface px-4 text-[0.95rem] text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-pine";

export default function ProductFilters({ total }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const { items: categories, listStatus } = useSelector(
    (state) => state.categories
  );

  useEffect(() => {
    if (listStatus === "idle") dispatch(fetchCategories());
  }, [listStatus, dispatch]);

  // The URL is the source of truth; these mirror it so typing stays responsive
  // while the debounced push catches up.
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [categoryId, setCategoryId] = useState(
    () => searchParams.get("categoryId") ?? ""
  );
  const [minPrice, setMinPrice] = useState(
    () => searchParams.get("minPrice") ?? ""
  );
  const [maxPrice, setMaxPrice] = useState(
    () => searchParams.get("maxPrice") ?? ""
  );

  const timerRef = useRef(null);
  useEffect(() => () => clearTimeout(timerRef.current), []);

  // Writes every filter at once rather than merging into the live URL, so a
  // debounced keystroke landing late can't resurrect a filter just cleared.
  // `page` is deliberately dropped — changing a filter invalidates it.
  const push = (overrides = {}) => {
    const values = { search, categoryId, minPrice, maxPrice, ...overrides };
    const next = new URLSearchParams();

    for (const [key, value] of Object.entries(values)) {
      if (value !== "" && value != null) next.set(key, value);
    }

    const query = next.toString();
    router.replace(query ? `/products?${query}` : "/products", {
      scroll: false,
    });
  };

  const schedule = (overrides) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => push(overrides), DEBOUNCE_MS);
  };

  const applyNow = (overrides) => {
    clearTimeout(timerRef.current);
    push(overrides);
  };

  const clearAll = () => {
    clearTimeout(timerRef.current);
    setSearch("");
    setCategoryId("");
    setMinPrice("");
    setMaxPrice("");
    router.replace("/products", { scroll: false });
  };

  const hasFilters = Boolean(search || categoryId || minPrice || maxPrice);

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,1.4fr)]">
        <div className="space-y-2">
          <label
            htmlFor="product-search"
            className="block text-xs font-semibold tracking-[0.12em] uppercase text-muted"
          >
            Search
          </label>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              id="product-search"
              type="search"
              value={search}
              placeholder="Search products"
              onChange={(e) => {
                setSearch(e.target.value);
                schedule({ search: e.target.value });
              }}
              className={`${fieldClass} pl-11`}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="product-category"
            className="block text-xs font-semibold tracking-[0.12em] uppercase text-muted"
          >
            Category
          </label>
          <select
            id="product-category"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              applyNow({ categoryId: e.target.value });
            }}
            className={fieldClass}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <span className="block text-xs font-semibold tracking-[0.12em] uppercase text-muted">
            Price range
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={minPrice}
              placeholder="Min"
              aria-label="Minimum price"
              onChange={(e) => {
                setMinPrice(e.target.value);
                schedule({ minPrice: e.target.value });
              }}
              className={fieldClass}
            />
            <span className="text-muted">&ndash;</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={maxPrice}
              placeholder="Max"
              aria-label="Maximum price"
              onChange={(e) => {
                setMaxPrice(e.target.value);
                schedule({ maxPrice: e.target.value });
              }}
              className={fieldClass}
            />
          </div>
        </div>
      </div>

      {hasFilters ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <p className="text-sm text-muted">
            {total === 1 ? "1 product" : `${total} products`} match your filters
          </p>
          <button
            type="button"
            onClick={clearAll}
            className="h-9 rounded-full border border-ink/20 px-4 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink/5"
          >
            Clear all
          </button>
        </div>
      ) : null}
    </div>
  );
}
