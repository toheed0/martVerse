import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RequireRole from "@/components/auth/RequireRole";
import CheckoutView from "@/components/checkout/CheckoutView";

export const metadata = {
  title: "Checkout — MartVerse",
};

export default function CheckoutPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <RequireRole roles={["buyer"]}>
          <CheckoutView />
        </RequireRole>
      </main>
      <Footer />
    </>
  );
}
