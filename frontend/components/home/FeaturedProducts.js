import Link from "next/link";
import ProductArt from "./ProductArt";
import { ArrowIcon, StarIcon } from "@/components/ui/icons";

const products = [
  {
    art: "vase",
    name: "Kaolin Stem Vase",
    vendor: "Studio Terra",
    price: "Rs 4,850",
    rating: "4.9",
    tint: "bg-tint-1",
    badge: "New",
  },
  {
    art: "chair",
    name: "Halden Lounge Chair",
    vendor: "Norda Works",
    price: "Rs 32,000",
    rating: "4.8",
    tint: "bg-tint-2",
  },
  {
    art: "bag",
    name: "Everyday Canvas Tote",
    vendor: "Field & Thread",
    price: "Rs 3,200",
    rating: "4.7",
    tint: "bg-tint-3",
    badge: "Bestseller",
  },
  {
    art: "watch",
    name: "Meridian Field Watch",
    vendor: "Atlas Horology",
    price: "Rs 18,400",
    rating: "5.0",
    tint: "bg-tint-4",
  },
];

export default function FeaturedProducts() {
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
            href="/"
            className="group flex items-center gap-2 text-sm font-semibold text-ink"
          >
            View all products
            <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <article key={product.name} className="group">
              <div
                className={`relative flex h-64 items-center justify-center rounded-2xl text-pine transition-transform duration-300 group-hover:-translate-y-1 ${product.tint}`}
              >
                {product.badge ? (
                  <span className="absolute top-4 left-4 rounded-full bg-surface px-3 py-1 text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-ink">
                    {product.badge}
                  </span>
                ) : null}

                <ProductArt name={product.art} className="h-36 w-36" />

                <button
                  type="button"
                  className="absolute right-4 bottom-4 h-10 rounded-full bg-ink px-5 text-xs font-semibold text-canvas opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Add to bag
                </button>
              </div>

              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.7rem] tracking-[0.12em] uppercase text-muted">
                    {product.vendor}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-semibold text-ink">
                    {product.name}
                  </h3>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-muted">
                  <StarIcon className="h-3.5 w-3.5 text-brass" />
                  {product.rating}
                </span>
              </div>

              <p className="mt-2 text-sm font-semibold text-ink">
                {product.price}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
