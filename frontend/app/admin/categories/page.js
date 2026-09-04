import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RequireRole from "@/components/auth/RequireRole";
import CategoryManager from "@/components/admin/CategoryManager";

export const metadata = {
  title: "Manage categories — MartVerse",
};

export default function AdminCategoriesPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <RequireRole roles={["admin"]}>
          <CategoryManager />
        </RequireRole>
      </main>
      <Footer />
    </>
  );
}
