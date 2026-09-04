"use client";

import Link from "next/link";
import { useSelector } from "react-redux";
import { ArrowIcon, BagIcon } from "@/components/ui/icons";

const roleStyles = {
  buyer: "border-line bg-sand text-ink",
  vendor: "border-brass/30 bg-brass/10 text-brass",
  admin: "border-pine/25 bg-pine/10 text-pine",
};

const getInitials = (name) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

export default function ProfileDetails() {
  const user = useSelector((state) => state.auth.user);

  // These are real counts — the backend has no orders or wishlist yet, so
  // every account genuinely has none.
  const stats = [
    { label: "Orders placed", value: "0" },
    { label: "Saved items", value: "0" },
    { label: "Reviews written", value: "0" },
  ];

  const details = [
    { label: "Full name", value: user.name },
    { label: "Email address", value: user.email },
    { label: "Account type", value: user.role },
    { label: "Member since", value: formatDate(user.createdAt) },
    { label: "Customer ID", value: user._id, mono: true },
  ];

  return (
    <div className="space-y-6 lg:col-span-9">
      {/* Identity */}
      <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-pine font-display text-2xl font-semibold text-canvas">
            {getInitials(user.name)}
          </span>

          <div className="min-w-0">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">
              {user.name}
            </h2>
            <p className="mt-1 truncate text-muted">{user.email}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-[0.65rem] font-semibold tracking-[0.12em] uppercase ${
                  roleStyles[user.role] || roleStyles.buyer
                }`}
              >
                {user.role}
              </span>
              <span className="flex items-center gap-1.5 rounded-full border border-pine/25 bg-pine/10 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.12em] uppercase text-pine">
                <span className="h-1.5 w-1.5 rounded-full bg-pine" />
                {user.status}
              </span>
            </div>
          </div>
        </div>

        <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-line pt-6">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-[0.7rem] tracking-wider uppercase text-muted">
                {stat.label}
              </dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-ink">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Account details */}
      <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <h3 className="font-display text-xl font-semibold text-ink">
          Account details
        </h3>

        <dl className="mt-6 divide-y divide-line">
          {details.map((row) => (
            <div
              key={row.label}
              className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            >
              <dt className="text-sm text-muted">{row.label}</dt>
              <dd
                className={`text-sm font-medium break-all text-ink ${
                  row.mono ? "font-mono text-xs" : ""
                } ${row.label === "Account type" ? "capitalize" : ""}`}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 border-t border-line pt-5 text-xs leading-relaxed text-muted">
          Need to change your name or email? Profile editing isn&apos;t
          available yet — the backend has no update endpoint so far.
        </p>
      </section>

      {/* Orders */}
      <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <h3 className="font-display text-xl font-semibold text-ink">
          Recent orders
        </h3>

        <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-line px-6 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-sand text-pine">
            <BagIcon />
          </span>
          <p className="mt-4 font-display text-lg font-semibold text-ink">
            No orders yet
          </p>
          <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted">
            Once you place an order it will show up here with its delivery
            status.
          </p>
          <Link
            href="/"
            className="mt-6 flex h-11 items-center gap-2 rounded-full bg-pine px-6 text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft"
          >
            Browse products
            <ArrowIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
