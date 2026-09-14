import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RequireRole from "@/components/auth/RequireRole";
import OrderDetail from "@/components/orders/OrderDetail";

export const metadata = {
  title: "Order — MartVerse",
};

export default function OrderDetailPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <RequireRole roles={["buyer", "admin"]}>
          <OrderDetail />
        </RequireRole>
      </main>
      <Footer />
    </>
  );
}
