import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RequireRole from "@/components/auth/RequireRole";
import VendorManager from "@/components/admin/VendorManager";

export const metadata = {
  title: "Manage vendors — MartVerse",
};

export default function AdminVendorsPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <RequireRole roles={["admin"]}>
          <VendorManager />
        </RequireRole>
      </main>
      <Footer />
    </>
  );
}
