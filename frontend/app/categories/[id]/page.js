import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CategoryDetail from "@/components/categories/CategoryDetail";

export const metadata = {
  title: "Category — MartVerse",
};

export default function CategoryDetailPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <CategoryDetail />
      </main>
      <Footer />
    </>
  );
}
