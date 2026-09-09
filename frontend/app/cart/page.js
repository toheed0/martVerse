import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RequireRole from "@/components/auth/RequireRole";
import CartView from "@/components/cart/CartView";

export const metadata = {
  title: "Your bag — MartVerse",
};

export default function CartPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <RequireRole roles={["buyer"]}>
          <CartView />
        </RequireRole>
      </main>
      <Footer />
    </>
  );
}
