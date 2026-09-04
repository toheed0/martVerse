import Link from "next/link";
import CategoryGrid from "@/components/categories/CategoryGrid";
import { ArrowIcon } from "@/components/ui/icons";

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
            href="/categories"
            className="group flex items-center gap-2 text-sm font-semibold text-ink"
          >
            View all categories
            <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="mt-12">
          <CategoryGrid limit={6} />
        </div>
      </div>
    </section>
  );
}
