import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoryGrid from "@/components/categories/CategoryGrid";

export const metadata = {
  title: "Categories — MartVerse",
  description: "Browse every category on the MartVerse marketplace.",
};

export default function CategoriesPage() {
  return (
    <>
      <Navbar />

      <main className="flex-1">
        <div className="border-b border-line">
          <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
            <p className="eyebrow text-brass">Browse</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
              All categories
            </h1>
            <p className="mt-4 max-w-md leading-relaxed text-muted">
              Every corner of the marketplace, curated by our team.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
          <CategoryGrid />
        </div>
      </main>

      <Footer />
    </>
  );
}
