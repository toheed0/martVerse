"use client";

import { useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "@/store/slices/authSlice";
import Logo from "@/components/ui/Logo";
import {
  BagIcon,
  CloseIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "@/components/ui/icons";

const navLinks = [
  { label: "New In", href: "/" },
  { label: "Collections", href: "/" },
  { label: "Vendors", href: "/" },
  { label: "Journal", href: "/" },
];

export default function Navbar() {
  const dispatch = useDispatch();
  const { user, isAuthenticated, bootstrapped } = useSelector(
    (state) => state.auth
  );
  const [menuOpen, setMenuOpen] = useState(false);

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
            aria-label="Search"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5 sm:flex"
          >
            <SearchIcon />
          </button>

          <button
            type="button"
            aria-label="Cart"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-ink/5"
          >
            <BagIcon />
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-brass" />
          </button>

          {/* Nothing is rendered until the session check finishes, so the
              navbar never flashes the wrong state. */}
          {!bootstrapped ? (
            <div className="ml-2 h-10 w-24 animate-pulse rounded-full bg-sand" />
          ) : isAuthenticated ? (
            <div className="ml-2 flex items-center gap-3">
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

      {menuOpen ? (
        <div className="border-t border-line bg-canvas px-5 py-4 lg:hidden">
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
