"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import {
  BagIcon,
  ReturnIcon,
  ShieldIcon,
  SparkIcon,
  UserIcon,
} from "@/components/ui/icons";

// An entry with an href is built; the rest are listed so the account area reads
// like a real storefront, but they're marked instead of pretending to work.
// `buyerOnly` keeps Orders out of the way for vendors and admins, who have no
// cart and would only land on a "not authorised" screen.
const items = [
  { label: "Profile", icon: UserIcon, href: "/profile" },
  { label: "Orders", icon: BagIcon, href: "/orders", buyerOnly: true },
  { label: "Wishlist", icon: SparkIcon },
  { label: "Addresses", icon: ReturnIcon },
  { label: "Security", icon: ShieldIcon },
];

const rowClass = "flex items-center gap-3 rounded-xl px-4 py-3 text-sm";

export default function AccountSidebar() {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const { user } = useSelector((state) => state.auth);

  const visible = items.filter(
    (item) => !item.buyerOnly || user?.role === "buyer"
  );

  return (
    <nav className="lg:col-span-3">
      <ul className="space-y-1">
        {visible.map((item) => {
          const active = item.href && pathname.startsWith(item.href);

          return (
            <li key={item.label}>
              {item.href ? (
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`${rowClass} font-semibold transition-colors ${
                    active
                      ? "bg-pine text-canvas"
                      : "text-ink hover:bg-ink/5"
                  }`}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                  <span>{item.label}</span>
                </Link>
              ) : (
                <div className={`${rowClass} cursor-not-allowed text-muted/70`}>
                  <item.icon className="h-[18px] w-[18px]" />
                  <span className="font-medium">{item.label}</span>
                  <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-[0.6rem] tracking-wider uppercase">
                    Soon
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={() => dispatch(logout())}
        className="mt-6 w-full rounded-xl border border-ink/15 px-4 py-3 text-sm font-semibold text-ink transition-colors hover:border-clay hover:bg-clay/5 hover:text-clay"
      >
        Sign out
      </button>
    </nav>
  );
}
