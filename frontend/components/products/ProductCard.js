import Link from "next/link";
import ProductImage from "./ProductImage";
import { Stars } from "@/components/reviews/Stars";
import WishlistButton from "@/components/account/WishlistButton";
import { formatPrice, stockLabel } from "@/lib/format";

const tints = ["bg-tint-1", "bg-tint-2", "bg-tint-3", "bg-tint-4"];

export default function ProductCard({ product, index = 0 }) {
  const stock = stockLabel(product.stock);
  const vendor = product.vendorId?.name;
  const category = product.categoryId?.name;

  return (
    <article className="group relative">
      <div className="absolute top-3 right-3 z-10">
        <WishlistButton productId={product._id} size="h-9 w-9" />
      </div>

      <Link href={`/products/${product._id}`} className="block">
        <div
          className={`relative flex h-64 items-center justify-center overflow-hidden rounded-2xl text-pine transition-transform duration-300 group-hover:-translate-y-1 ${
            tints[index % tints.length]
          }`}
        >
          <ProductImage product={product} artClassName="h-36 w-36" />

          {stock.tone === "out" ? (
            <span className="absolute top-4 left-4 rounded-full bg-ink/85 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-canvas">
              Sold out
            </span>
          ) : stock.tone === "low" ? (
            <span className="absolute top-4 left-4 rounded-full bg-surface px-3 py-1 text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-clay">
              {stock.text}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {vendor ? (
              <p className="truncate text-[0.7rem] tracking-[0.12em] uppercase text-muted">
                {vendor}
              </p>
            ) : null}
            <h3 className="mt-1 font-display text-lg leading-snug font-semibold text-ink">
              {product.name}
            </h3>
          </div>

          {category ? (
            <span className="shrink-0 rounded-full border border-line bg-sand px-2.5 py-0.5 text-[0.62rem] tracking-[0.1em] uppercase text-muted">
              {category}
            </span>
          ) : null}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-sm font-semibold text-ink">
            {formatPrice(product.price)}
          </p>

          {/* Nothing at all until someone has rated it — an empty row of stars
              looks like a one-star product rather than a new one. */}
          {product.ratingCount > 0 ? (
            <span className="flex items-center gap-1.5">
              <Stars value={product.ratingAverage} className="h-3.5 w-3.5" />
              <span className="text-xs text-muted">({product.ratingCount})</span>
            </span>
          ) : null}
        </div>
      </Link>
    </article>
  );
}
