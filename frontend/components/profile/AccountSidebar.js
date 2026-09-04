"use client";

import { useDispatch } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import {
  BagIcon,
  ReturnIcon,
  ShieldIcon,
  SparkIcon,
  UserIcon,
} from "@/components/ui/icons";

// Only Profile is built. The rest are listed so the account area reads like a
// real storefront, but they're marked instead of pretending to work.
const items = [
  { label: "Profile", icon: UserIcon, ready: true },
  { label: "Orders", icon: BagIcon },
  { label: "Wishlist", icon: SparkIcon },
  { label: "Addresses", icon: ReturnIcon },
  { label: "Security", icon: ShieldIcon },
];

export default function AccountSidebar() {
  const dispatch = useDispatch();

  return (
    <nav className="lg:col-span-3">
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.label}>
            <div
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
                item.ready
                  ? "bg-pine text-canvas"
                  : "cursor-not-allowed text-muted/70"
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" />
              <span className={item.ready ? "font-semibold" : "font-medium"}>
                {item.label}
              </span>
              {item.ready ? null : (
                <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-[0.6rem] tracking-wider uppercase">
                  Soon
                </span>
              )}
            </div>
          </li>
        ))}
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
