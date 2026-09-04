import Link from "next/link";
import Logo from "@/components/ui/Logo";
import ProductArt from "@/components/home/ProductArt";
import { ArrowIcon, StarIcon } from "@/components/ui/icons";

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
      {/* Brand panel — hidden on small screens so the form gets the space */}
      <aside className="relative hidden overflow-hidden bg-pine px-12 py-14 text-canvas lg:flex lg:w-[46%] lg:flex-col lg:justify-between xl:px-16">
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-pine-soft/60 blur-3xl" />

        <div className="relative">
          <Logo tone="light" />
        </div>

        <div className="relative max-w-md">
          <div className="mb-10 flex h-52 w-52 items-center justify-center rounded-2xl border border-canvas/15 bg-canvas/10 text-brass">
            <ProductArt name="candle" className="h-32 w-32" />
          </div>

          <div className="flex gap-0.5 text-brass">
            {[0, 1, 2, 3, 4].map((i) => (
              <StarIcon key={i} />
            ))}
          </div>

          <blockquote className="mt-5 font-display text-3xl leading-snug font-semibold">
            &ldquo;The only marketplace where I actually know who made what
            I&apos;m buying.&rdquo;
          </blockquote>
          <p className="mt-5 text-sm text-canvas/60">
            Hina Raza — buyer since 2024
          </p>
        </div>

        <div className="relative flex items-center justify-between border-t border-canvas/15 pt-8 text-sm text-canvas/60">
          <span>2,400+ vetted vendors</span>
          <Link
            href="/"
            className="group flex items-center gap-2 text-canvas transition-colors hover:text-brass"
          >
            Back to store
            <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </aside>

      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-line px-5 py-5 lg:hidden">
          <Logo />
          <Link href="/" className="text-sm font-medium text-muted">
            Back to store
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-12 sm:px-10 lg:py-16">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
