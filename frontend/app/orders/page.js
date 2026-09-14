import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RequireRole from "@/components/auth/RequireRole";
import OrderList from "@/components/orders/OrderList";

export const metadata = {
  title: "Your orders — MartVerse",
};

export default function OrdersPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <RequireRole roles={["buyer"]}>
          <OrderList />
        </RequireRole>
      </main>
      <Footer />
    </>
  );
}
