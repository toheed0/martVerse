import { Fraunces, Manrope } from "next/font/google";
import Providers from "@/store/Providers";
import "./globals.css";

// Fraunces for display type, Manrope for everything else — a serif/grotesk
// pairing that reads more like a retail brand than a dashboard.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "MartVerse — A curated marketplace for things worth keeping",
  description:
    "MartVerse brings independent makers and vetted vendors together in one marketplace. Shop curated home, apparel and accessories, or apply to sell.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
