import Link from "next/link";
import Logo from "@/components/ui/Logo";

const columns = [
  {
    title: "Shop",
    links: ["New Arrivals", "Best Sellers", "Home & Living", "Accessories"],
  },
  {
    title: "Marketplace",
    links: ["Become a Vendor", "Vendor Guidelines", "Shipping", "Returns"],
  },
  {
    title: "Company",
    links: ["Our Story", "Journal", "Careers", "Contact"],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">
              A curated marketplace where independent makers and trusted vendors
              sell to buyers who care about how things are made.
            </p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="eyebrow text-ink">{column.title}</h3>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link}>
                    <Link
                      href="/"
                      className="text-sm text-muted transition-colors hover:text-ink"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} MartVerse. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/" className="text-xs text-muted hover:text-ink">
              Privacy Policy
            </Link>
            <Link href="/" className="text-xs text-muted hover:text-ink">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
