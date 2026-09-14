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

// `buyerOnly` keeps the shopping half out of the way for vendors and admins,
// who have no cart and would only land on a "not authorised" screen. Security
// is for everyone — every account has a password.
const items = [
  { label: "Profile", icon: UserIcon, href: "/profile" },
  { label: "Orders", icon: BagIcon, href: "/orders", buyerOnly: true },
  { label: "Wishlist", icon: SparkIcon, href: "/wishlist", buyerOnly: true },
  {
    label: "Addresses",
    icon: ReturnIcon,
    href: "/profile/addresses",
    buyerOnly: true,
  },
  { label: "Security", icon: ShieldIcon, href: "/profile/security" },
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
          // "/profile" is a prefix of "/profile/addresses", so a plain
          // startsWith would light up two rows at once on the sub-pages.
          const active =
            item.href === "/profile"
              ? pathname === "/profile"
              : pathname.startsWith(item.href);

          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`${rowClass} font-semibold transition-colors ${
                  active ? "bg-pine text-canvas" : "text-ink hover:bg-ink/5"
                }`}
              >
                <item.icon className="h-[18px] w-[18px]" />
                <span>{item.label}</span>
              </Link>
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
