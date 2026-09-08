import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductDetail from "@/components/products/ProductDetail";

export const metadata = {
  title: "Product — MartVerse",
};

export default function ProductDetailPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <ProductDetail />
      </main>
      <Footer />
    </>
  );
}
