"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import { selectCartCount } from "@/store/slices/cartSlice";
import Logo from "@/components/ui/Logo";
import {
  BagIcon,
  CloseIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "@/components/ui/icons";

const navLinks = [
  { label: "New In", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "Vendors", href: "/" },
  { label: "Journal", href: "/" },
];

// Each role that has a management area gets the same treatment in both the
// desktop bar and the mobile sheet.
const dashboards = {
  admin: {
    href: "/admin/categories",
    label: "Admin",
    mobileLabel: "Manage categories",
  },
  vendor: {
    href: "/vendor/products",
    label: "Vendor",
    mobileLabel: "Manage products",
  },
};

export default function Navbar() {
  const dispatch = useDispatch();
  const { user, isAuthenticated, bootstrapped } = useSelector(
    (state) => state.auth
  );
  const cartCount = useSelector(selectCartCount);
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef(null);

  // Opening the row and then having to click into it would make the button
  // feel like it did half a job.
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  // /products already reads `search` off the query string and filters on it,
  // so this only has to get the shopper there with the right URL.
  const submitSearch = (event) => {
    event.preventDefault();

    const term = query.trim();
    if (!term) return;

    router.push(`/products?search=${encodeURIComponent(term)}`);

    setSearchOpen(false);
    setMenuOpen(false);
    setQuery("");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/85 backdrop-blur-md">
      {/* Announcement strip */}
      <div className="bg-pine px-4 py-2 text-center text-[0.7rem] tracking-[0.14em] uppercase text-canvas/90">
        Complimentary delivery on orders over Rs 5,000
      </div>

      <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-5 py-4 lg:px-8">
        <Logo />

        <ul className="hidden items-center gap-9 lg:flex">
          {navLinks.map((link) => (
            <li key={link.label}>
              <Link
                href={link.href}
                className="text-sm font-medium text-muted transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label={searchOpen ? "Close search" : "Search"}
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((open) => !open)}
            className="hidden h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 sm:flex"
          >
            {searchOpen ? <CloseIcon /> : <SearchIcon />}
          </button>

          <Link
            href="/cart"
            aria-label={
              cartCount ? `Cart, ${cartCount} items` : "Cart"
            }
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5"
          >
            <BagIcon />
            {cartCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brass px-1 text-[0.65rem] font-semibold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            ) : null}
          </Link>

          {/* Nothing is rendered until the session check finishes, so the
              navbar never flashes the wrong state. */}
          {!bootstrapped ? (
            <div className="ml-2 h-10 w-24 animate-pulse rounded-full bg-sand" />
          ) : isAuthenticated ? (
            <div className="ml-2 flex items-center gap-3">
              {dashboards[user.role] ? (
                <Link
                  href={dashboards[user.role].href}
                  className="hidden h-10 items-center rounded-full border border-brass/40 px-4 text-xs font-semibold tracking-wider uppercase text-brass transition-colors hover:bg-brass/10 lg:flex"
                >
                  {dashboards[user.role].label}
                </Link>
              ) : null}
              <Link
                href="/profile"
                className="hidden text-right sm:block"
                title="View your account"
              >
                <p className="text-sm font-semibold text-ink hover:text-pine">
                  {user.name}
                </p>
                <p className="text-[0.7rem] tracking-wider uppercase text-muted">
                  {user.role}
                </p>
              </Link>
              <button
                type="button"
                onClick={() => dispatch(logout())}
                className="h-10 rounded-full border border-ink/20 px-5 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink/5"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="ml-2 hidden items-center gap-2 sm:flex">
              <Link
                href="/login"
                className="flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink transition-colors hover:bg-ink/5"
              >
                <UserIcon className="h-4 w-4" />
                Sign in
              </Link>
              <Link
                href="/register"
                className="flex h-10 items-center rounded-full bg-pine px-5 text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft"
              >
                Create account
              </Link>
            </div>
          )}

          <button
            type="button"
            aria-label="Menu"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 lg:hidden"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </nav>

      {searchOpen ? (
        <div className="border-t border-line bg-canvas">
          <form
            onSubmit={submitSearch}
            className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-4 lg:px-8"
          >
            <SearchIcon className="h-5 w-5 shrink-0 text-muted" />
            <input
              ref={searchInputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setSearchOpen(false);
              }}
              placeholder="Search products"
              aria-label="Search products"
              className="h-10 flex-1 bg-transparent text-[0.95rem] text-ink outline-none placeholder:text-muted/60"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="h-10 shrink-0 rounded-full bg-pine px-5 text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft disabled:opacity-40"
            >
              Search
            </button>
          </form>
        </div>
      ) : null}

      {menuOpen ? (
        <div className="border-t border-line bg-canvas px-5 py-4 lg:hidden">
          {/* The search icon is hidden below sm, so the sheet is the only way
              to search from a phone. */}
          <form onSubmit={submitSearch} className="mb-3 flex items-center gap-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              className="h-11 flex-1 rounded-xl border border-line bg-surface px-4 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-pine"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              aria-label="Search"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pine text-canvas disabled:opacity-40"
            >
              <SearchIcon className="h-4 w-4" />
            </button>
          </form>

          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:bg-ink/5 hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {!bootstrapped ? null : isAuthenticated ? (
            // The name link in the top bar is hidden on mobile, so this is the
            // only way to reach the account page on a phone.
            <div className="mt-3 border-t border-line pt-3">
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex h-11 items-center justify-center gap-2 rounded-full bg-pine text-sm font-semibold text-canvas"
              >
                <UserIcon className="h-4 w-4" />
                My account
              </Link>

              {dashboards[user.role] ? (
                <Link
                  href={dashboards[user.role].href}
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 flex h-11 items-center justify-center rounded-full border border-brass/40 text-sm font-semibold text-brass"
                >
                  {dashboards[user.role].mobileLabel}
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className="flex h-11 items-center justify-center rounded-full border border-ink/20 text-sm font-semibold"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className="flex h-11 items-center justify-center rounded-full bg-pine text-sm font-semibold text-canvas"
              >
                Create account
              </Link>
            </div>
          )}
        </div>
      ) : null}
    </header>
  );
}
