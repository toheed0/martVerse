"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, updateUserStatus } from "@/store/slices/userSlice";
import AdminTabs from "./AdminTabs";
import Alert from "@/components/ui/Alert";

const statusStyles = {
  pending: "border-brass/30 bg-brass/10 text-brass",
  active: "border-pine/25 bg-pine/10 text-pine",
  rejected: "border-clay/30 bg-clay/10 text-clay",
  blocked: "border-clay/30 bg-clay/10 text-clay",
};

const filters = ["pending", "active", "rejected", "blocked", "all"];

// What an admin can do next, per current status.
const actionsFor = (status) => {
  if (status === "pending") {
    return [
      { label: "Approve", next: "active", tone: "primary" },
      { label: "Reject", next: "rejected", tone: "danger" },
    ];
  }
  if (status === "active") {
    return [{ label: "Block", next: "blocked", tone: "danger" }];
  }
  // rejected or blocked — the only way forward is to let them in.
  return [{ label: "Approve", next: "active", tone: "primary" }];
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

export default function VendorManager() {
  const dispatch = useDispatch();
  const { items, status, error, updatingId, actionError } = useSelector(
    (state) => state.users
  );

  const [filter, setFilter] = useState("pending");

  // Vendor lists are small, so fetch once and filter in the browser — the tabs
  // stay instant and every count is available without extra requests.
  useEffect(() => {
    dispatch(fetchUsers({ role: "vendor" }));
  }, [dispatch]);

  const counts = items.reduce((acc, user) => {
    acc[user.status] = (acc[user.status] || 0) + 1;
    return acc;
  }, {});

  const visible =
    filter === "all" ? items : items.filter((user) => user.status === filter);

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
      <AdminTabs />

      <div className="mt-8">
        <p className="eyebrow text-brass">Admin</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Vendors
        </h1>
        <p className="mt-3 text-muted">
          {status === "succeeded"
            ? counts.pending
              ? `${counts.pending} waiting for approval`
              : "Nothing waiting for approval"
            : "Loading..."}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {filters.map((value) => {
          const count = value === "all" ? items.length : counts[value] || 0;

          return (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold capitalize transition-colors ${
                filter === value
                  ? "bg-pine text-canvas"
                  : "border border-line text-muted hover:border-ink/30 hover:text-ink"
              }`}
            >
              {value}
              <span
                className={`rounded-full px-1.5 text-xs ${
                  filter === value ? "bg-canvas/20" : "bg-sand"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 space-y-3">
        <Alert type="error">{actionError}</Alert>

        {status === "loading" ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-sand" />
          ))
        ) : status === "failed" ? (
          <Alert type="error">{error}</Alert>
        ) : visible.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
            <p className="font-display text-lg font-semibold text-ink">
              {filter === "all"
                ? "No vendor accounts yet"
                : `No ${filter} vendors`}
            </p>
            <p className="mt-2 text-sm text-muted">
              Vendors appear here as soon as someone registers with a vendor
              account.
            </p>
          </div>
        ) : (
          visible.map((vendor) => {
            const isBusy = updatingId === vendor._id;

            return (
              <div
                key={vendor._id}
                className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sand font-display text-lg font-semibold text-pine">
                    {vendor.name?.charAt(0).toUpperCase()}
                  </span>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-lg font-semibold text-ink">
                        {vendor.name}
                      </h3>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-[0.62rem] font-semibold tracking-[0.12em] uppercase ${
                          statusStyles[vendor.status]
                        }`}
                      >
                        {vendor.status}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted">
                      {vendor.email}
                      {vendor.createdAt
                        ? ` · joined ${formatDate(vendor.createdAt)}`
                        : ""}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {actionsFor(vendor.status).map((action) => (
                    <button
                      key={action.next}
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        dispatch(
                          updateUserStatus({
                            id: vendor._id,
                            status: action.next,
                          })
                        )
                      }
                      className={`h-10 rounded-full px-5 text-sm font-semibold transition-colors disabled:opacity-60 ${
                        action.tone === "primary"
                          ? "bg-pine text-canvas hover:bg-pine-soft"
                          : "text-clay hover:bg-clay/10"
                      }`}
                    >
                      {isBusy ? "Working..." : action.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <p className="mt-8 rounded-xl border border-line bg-sand/60 px-5 py-4 text-xs leading-relaxed text-muted">
        New vendor registrations start as pending and cannot sign in until you
        approve them. Rejecting or blocking an account also signs it out
        everywhere.
      </p>
    </div>
  );
}
