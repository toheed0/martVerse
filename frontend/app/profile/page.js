import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RequireAuth from "@/components/auth/RequireAuth";
import AccountSidebar from "@/components/profile/AccountSidebar";
import ProfileDetails from "@/components/profile/ProfileDetails";

export const metadata = {
  title: "My Account MartVerse",
  description: "View your MartVerse account details and order history.",
};

export default function ProfilePage() {
  return (
    <>
      <Navbar />

      <main className="flex flex-1 flex-col">
        <RequireAuth>
          {/* <div className="border-b border-line">
            <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
              <p className="eyebrow text-brass">Your account</p>
              <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                My Account
              </h1>
            </div>
          </div> */}

          <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-12 lg:grid-cols-12 lg:px-8 lg:py-16">
            <AccountSidebar />
            <ProfileDetails />
          </div>
        </RequireAuth>
      </main>

      <Footer />
    </>
  );
}
