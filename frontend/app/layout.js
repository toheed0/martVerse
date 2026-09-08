import { Plus_Jakarta_Sans, Spectral } from "next/font/google";
import Providers from "@/store/Providers";
import "./globals.css";

// Plus Jakarta Sans carries everything — headings, body, UI. Spectral is the
// accent voice only, used through the .accent-* classes in globals.css.
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

// Spectral has no variable build, so the weights are listed explicitly.
// Only 600 and 700 ship — 500 falls back to 600 to keep the payload small.
const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata = {
  title: "MartVerse A curated marketplace for things worth keeping",
  description:
    "MartVerse brings independent makers and vetted vendors together in one marketplace. Shop curated home, apparel and accessories, or apply to sell.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${spectral.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
