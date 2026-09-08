import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RequireRole from "@/components/auth/RequireRole";
import ProductManager from "@/components/vendor/ProductManager";

export const metadata = {
  title: "Your products — MartVerse",
};

export default function VendorProductsPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <RequireRole roles={["vendor"]}>
          <ProductManager />
        </RequireRole>
      </main>
      <Footer />
    </>
  );
}
