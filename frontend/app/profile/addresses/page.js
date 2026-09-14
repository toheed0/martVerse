import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RequireAuth from "@/components/auth/RequireAuth";
import AccountSidebar from "@/components/profile/AccountSidebar";
import AddressManager from "@/components/account/AddressManager";

export const metadata = {
  title: "Saved addresses — MartVerse",
};

export default function AddressManagerPage() {
  return (
    <>
      <Navbar />

      <main className="flex flex-1 flex-col">
        <RequireAuth>
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-12 lg:grid-cols-12 lg:px-8 lg:py-16">
            <AccountSidebar />
            <div className="lg:col-span-9">
              <AddressManager />
            </div>
          </div>
        </RequireAuth>
      </main>

      <Footer />
    </>
  );
}
