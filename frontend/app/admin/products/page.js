import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RequireRole from "@/components/auth/RequireRole";
import ProductManager from "@/components/admin/ProductManager";

export const metadata = {
  title: "Manage products — MartVerse",
};

export default function AdminProductsPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <RequireRole roles={["admin"]}>
          <ProductManager />
        </RequireRole>
      </main>
      <Footer />
    </>
  );
}
