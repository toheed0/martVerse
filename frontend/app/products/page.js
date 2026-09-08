import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductsBrowser from "@/components/products/ProductsBrowser";

export const metadata = {
  title: "Products — MartVerse",
  description: "Browse every product listed on the MartVerse marketplace.",
};

function BrowserFallback() {
  return (
    <div className="space-y-8">
      <div className="h-32 animate-pulse rounded-2xl bg-sand" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-sand" />
        ))}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1">
        <div className="border-b border-line">
          <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
            <p className="eyebrow text-brass">Shop</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              All products
            </h1>
            <p className="mt-4 max-w-md leading-relaxed text-muted">
              Everything our vendors are listing right now, from a single shelf.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          {/* ProductsBrowser reads the query string, which forces client-side
              rendering — this boundary keeps the shell above prerendered. */}
          <Suspense fallback={<BrowserFallback />}>
            <ProductsBrowser />
          </Suspense>
        </div>
      </main>

      <Footer />
    </>
  );
}
