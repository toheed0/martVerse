import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RequireRole from "@/components/auth/RequireRole";
import AccountSidebar from "@/components/profile/AccountSidebar";
import WishlistView from "@/components/account/WishlistView";

export const metadata = {
  title: "Your wishlist — MartVerse",
};

// Buyers only — the wishlist exists to be added to a cart, and vendors and
// admins have neither.
export default function WishlistPage() {
  return (
    <>
      <Navbar />

      <main className="flex flex-1 flex-col">
        <RequireRole roles={["buyer"]}>
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-12 lg:grid-cols-12 lg:px-8 lg:py-16">
            <AccountSidebar />
            <div className="lg:col-span-9">
              <WishlistView />
            </div>
          </div>
        </RequireRole>
      </main>

      <Footer />
    </>
  );
}
