"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchCategoryById } from "@/store/slices/categorySlice";
import ProductArt from "@/components/home/ProductArt";
import { ArrowIcon, BagIcon } from "@/components/ui/icons";

export default function CategoryDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current, currentStatus, currentError } = useSelector(
    (state) => state.categories
  );

  useEffect(() => {
    if (id) dispatch(fetchCategoryById(id));
  }, [id, dispatch]);

  if (currentStatus === "loading" || currentStatus === "idle") {
    return (
      <div className="mx-auto w-full max-w-7xl px-5 py-16 lg:px-8">
        <div className="h-4 w-40 animate-pulse rounded bg-sand" />
        <div className="mt-6 h-12 w-80 animate-pulse rounded bg-sand" />
        <div className="mt-10 h-64 animate-pulse rounded-2xl bg-sand" />
      </div>
    );
  }

  // The API returns 404 both for a missing id and for a deactivated category.
  if (currentStatus === "failed") {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-24">
        <div className="max-w-sm text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Category not found
          </h1>
          <p className="mt-3 leading-relaxed text-muted">{currentError}</p>
          <Link
            href="/categories"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-pine px-7 text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft"
          >
            Browse all categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-line">
        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          <nav className="flex items-center gap-2 text-sm text-muted">
            <Link href="/" className="hover:text-ink">
              Home
            </Link>
            <span>/</span>
            <Link href="/categories" className="hover:text-ink">
              Categories
            </Link>
            <span>/</span>
            <span className="text-ink">{current.name}</span>
          </nav>

          <div className="mt-6 grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
            <div>
              <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                {current.name}
              </h1>

              {current.description ? (
                <p className="mt-4 max-w-lg leading-relaxed text-muted">
                  {current.description}
                </p>
              ) : null}

              <span className="mt-6 inline-block rounded-full border border-line bg-sand px-3 py-1 font-mono text-xs text-muted">
                /{current.slug}
              </span>
            </div>

            {current.image?.url ? (
              <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-line bg-sand">
                <Image
                  src={current.image.url}
                  alt={current.name}
                  fill
                  sizes="(min-width: 1024px) 24rem, 100vw"
                  className="object-cover"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-sand text-pine">
            <BagIcon className="h-6 w-6" />
          </span>
          <p className="mt-5 font-display text-2xl font-semibold text-ink">
            No products in {current.name} yet
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Products aren&apos;t part of the backend yet. Once vendors start
            listing, everything in this category will show up here.
          </p>
          <div className="mt-8 opacity-40">
            <ProductArt name="bag" className="h-24 w-24 text-pine" />
          </div>
          <Link
            href="/categories"
            className="group mt-8 flex items-center gap-2 text-sm font-semibold text-ink"
          >
            Back to categories
            <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </>
  );
}
