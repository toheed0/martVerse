"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductById } from "@/store/slices/productSlice";
import ProductArt from "@/components/home/ProductArt";
import { artFor } from "./ProductImage";
import AddToCartButton from "@/components/cart/AddToCartButton";
import { formatPrice, stockLabel } from "@/lib/format";
import { ArrowIcon } from "@/components/ui/icons";
import { Stars } from "@/components/reviews/Stars";
import ProductReviews from "@/components/reviews/ProductReviews";
import WishlistButton from "@/components/account/WishlistButton";

const stockStyles = {
  in: "border-pine/25 bg-pine/10 text-pine",
  low: "border-brass/30 bg-brass/10 text-brass",
  out: "border-line bg-sand text-muted",
};

export default function ProductDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current, currentStatus, currentError } = useSelector(
    (state) => state.products
  );

  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (id) dispatch(fetchProductById(id));
  }, [id, dispatch]);

  if (currentStatus === "loading" || currentStatus === "idle") {
    return (
      <div className="mx-auto w-full max-w-7xl px-5 py-16 lg:px-8">
        <div className="h-4 w-48 animate-pulse rounded bg-sand" />
        <div className="mt-10 grid gap-10 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl bg-sand" />
          <div className="space-y-4 pt-4">
            <div className="h-3 w-28 animate-pulse rounded bg-sand" />
            <div className="h-10 w-72 animate-pulse rounded bg-sand" />
            <div className="h-6 w-32 animate-pulse rounded bg-sand" />
            <div className="h-24 w-full animate-pulse rounded bg-sand" />
          </div>
        </div>
      </div>
    );
  }

  // The API returns 404 both for a missing id and for a deactivated product.
  if (currentStatus === "failed") {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-24">
        <div className="max-w-sm text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Product not found
          </h1>
          <p className="mt-3 leading-relaxed text-muted">{currentError}</p>
          <Link
            href="/products"
            className="mt-8 inline-flex h-12 items-center rounded-full bg-pine px-7 text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft"
          >
            Browse all products
          </Link>
        </div>
      </div>
    );
  }

  const images = current.images?.filter(Boolean) ?? [];
  const stock = stockLabel(current.stock);
  const category = current.categoryId;
  const vendor = current.vendorId?.name;
  // A stale index would blank the gallery if the product changed under us.
  const shown = images[activeImage] ?? images[0];

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/" className="hover:text-ink">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-ink">
          Products
        </Link>
        {category?.name ? (
          <>
            <span>/</span>
            <Link
              href={`/products?categoryId=${category._id}`}
              className="hover:text-ink"
            >
              {category.name}
            </Link>
          </>
        ) : null}
        <span>/</span>
        <span className="text-ink">{current.name}</span>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-tint-1 text-pine">
            {shown ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={shown}
                alt={current.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <ProductArt name={artFor(current._id)} className="h-56 w-56" />
            )}
          </div>

          {images.length > 1 ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`View image ${index + 1}`}
                  aria-current={index === activeImage}
                  className={`h-20 w-20 overflow-hidden rounded-xl border-2 transition-colors ${
                    index === activeImage
                      ? "border-pine"
                      : "border-line hover:border-ink/30"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          {vendor ? (
            <p className="eyebrow text-brass">{vendor}</p>
          ) : null}

          <h1 className="mt-3 font-display text-4xl leading-tight font-semibold tracking-tight text-ink sm:text-5xl">
            {current.name}
          </h1>

          {/* Only shown once somebody has actually rated it — five grey stars
              on a new listing reads as a bad score rather than no score. */}
          {current.ratingCount > 0 ? (
            <a
              href="#reviews"
              className="mt-3 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
            >
              <Stars value={current.ratingAverage} />
              <span className="font-semibold text-ink">
                {current.ratingAverage.toFixed(1)}
              </span>
              <span>
                ({current.ratingCount}{" "}
                {current.ratingCount === 1 ? "review" : "reviews"})
              </span>
            </a>
          ) : null}

          <p className="mt-5 font-display text-3xl font-semibold text-ink">
            {formatPrice(current.price)}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-[0.68rem] font-semibold tracking-[0.12em] uppercase ${
                stockStyles[stock.tone]
              }`}
            >
              {stock.text}
            </span>

            {category?.name ? (
              <Link
                href={`/products?categoryId=${category._id}`}
                className="rounded-full border border-line bg-sand px-3 py-1 text-[0.68rem] tracking-[0.1em] uppercase text-muted transition-colors hover:text-ink"
              >
                {category.name}
              </Link>
            ) : null}
          </div>

          <div className="mt-8 border-t border-line pt-8">
            <h2 className="text-xs font-semibold tracking-[0.12em] uppercase text-muted">
              Description
            </h2>
            <p className="mt-3 leading-relaxed whitespace-pre-line text-muted">
              {current.description}
            </p>
          </div>

          <div className="flex items-end gap-3">
            <div className="min-w-0 flex-1">
              <AddToCartButton product={current} />
            </div>
            <WishlistButton
              productId={current._id}
              size="h-14 w-14"
              className="shrink-0 border border-line"
            />
          </div>

          <Link
            href="/products"
            className="group mt-10 flex items-center gap-2 text-sm font-semibold text-ink"
          >
            Back to all products
            <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      <div id="reviews" className="mt-16 scroll-mt-24">
        <ProductReviews product={current} />
      </div>
    </div>
  );
}
