import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RequireRole from "@/components/auth/RequireRole";
import OrderManager from "@/components/admin/OrderManager";

export const metadata = {
  title: "Manage orders — MartVerse",
};

export default function AdminOrdersPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <RequireRole roles={["admin"]}>
          <OrderManager />
        </RequireRole>
      </main>
      <Footer />
    </>
  );
}
