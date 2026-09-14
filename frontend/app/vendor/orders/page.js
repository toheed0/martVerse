import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RequireRole from "@/components/auth/RequireRole";
import OrderManager from "@/components/vendor/OrderManager";

export const metadata = {
  title: "Your sales — MartVerse",
};

export default function VendorOrdersPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <RequireRole roles={["vendor"]}>
          <OrderManager />
        </RequireRole>
      </main>
      <Footer />
    </>
  );
}
