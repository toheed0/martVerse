import Link from "next/link";
import { ArrowIcon } from "@/components/ui/icons";

const categories = [
  { name: "Home & Living", count: "842 products", tint: "bg-tint-1" },
  { name: "Ceramics", count: "316 products", tint: "bg-tint-2" },
  { name: "Apparel", count: "1,204 products", tint: "bg-tint-3" },
  { name: "Accessories", count: "658 products", tint: "bg-tint-4" },
  { name: "Lighting", count: "233 products", tint: "bg-tint-2" },
  { name: "Stationery", count: "415 products", tint: "bg-tint-1" },
];

export default function Categories() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-brass">Browse</p>
            <h2 className="mt-3 max-w-lg font-display text-4xl leading-tight font-semibold tracking-tight text-ink sm:text-5xl">
              Shop by category
            </h2>
          </div>
          <Link
            href="/"
            className="group flex items-center gap-2 text-sm font-semibold text-ink"
          >
            View all categories
            <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.name}
              href="/"
              className={`group flex h-44 flex-col justify-end rounded-2xl border border-line/60 p-6 transition-transform duration-300 hover:-translate-y-1 ${category.tint}`}
            >
              <h3 className="font-display text-2xl font-semibold text-ink">
                {category.name}
              </h3>
              <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                {category.count}
                <ArrowIcon className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
