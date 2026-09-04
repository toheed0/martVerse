import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import ValueProps from "@/components/home/ValueProps";
import Categories from "@/components/home/Categories";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import VendorCta from "@/components/home/VendorCta";
import Newsletter from "@/components/home/Newsletter";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <ValueProps />
        <Categories />
        <FeaturedProducts />
        <VendorCta />
        <Newsletter />
      </main>
      <Footer />
    </>
  );
}
