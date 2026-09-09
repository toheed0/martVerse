"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/products", label: "Products" },
];

// The navbar only has room for one admin link, so the admin area carries its
// own switcher between the management screens.
export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const active = pathname === tab.href;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-10 items-center rounded-full px-5 text-sm font-semibold transition-colors ${
              active
                ? "bg-ink text-canvas"
                : "border border-line text-muted hover:border-ink/30 hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
