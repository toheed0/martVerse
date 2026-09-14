"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyOrders } from "@/store/slices/orderSlice";
import OrderStatusBadge, {
  PaymentBadge,
  orderNumber,
} from "@/components/orders/OrderStatusBadge";
import { ArrowIcon, BagIcon } from "@/components/ui/icons";
import { formatDate as formatOrderDate, formatPrice } from "@/lib/format";

// A summary, not the order history. Six fills the panel without turning the
// profile into a second copy of /orders, which the link at the bottom goes to.
const RECENT_LIMIT = 6;

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
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const {
    items: orders,
    status: orderStatus,
    error: orderError,
  } = useSelector((state) => state.orders);

  // /api/orders is buyer-only, so asking as a vendor or an admin earns a 403.
  // They also cannot place orders in the first place — the cart is buyer-only
  // too — so there is nothing to show them either way.
  const isBuyer = user.role === "buyer";

  useEffect(() => {
    if (isBuyer && orderStatus === "idle") dispatch(fetchMyOrders());
  }, [isBuyer, orderStatus, dispatch]);

  const ordersLoading =
    isBuyer && (orderStatus === "idle" || orderStatus === "loading");

  const recentOrders = orders.slice(0, RECENT_LIMIT);

  // Wishlist and reviews are not built, so those two are honestly zero. The
  // order count is not — it was left hardcoded here when orders were added.
  const stats = [
    {
      label: "Orders placed",
      value: ordersLoading ? "—" : String(orders.length),
    },
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

      {/* Orders. Buyers only — nobody else can have any. */}
      {isBuyer ? (
        <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="font-display text-xl font-semibold text-ink">
              Recent orders
            </h3>

            {/* Only worth offering once there is more than this panel shows. */}
            {orders.length > RECENT_LIMIT ? (
              <Link
                href="/orders"
                className="group flex items-center gap-2 text-sm font-semibold text-ink"
              >
                View all {orders.length}
                <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            ) : null}
          </div>

          {ordersLoading ? (
            <div className="mt-6 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-sand" />
              ))}
            </div>
          ) : orderStatus === "failed" ? (
            <div className="mt-6 rounded-xl border border-clay/30 bg-clay/5 px-6 py-8 text-center">
              <p className="font-display text-base font-semibold text-ink">
                Couldn&apos;t load your orders
              </p>
              <p className="mt-2 text-sm text-muted">{orderError}</p>
              <button
                type="button"
                onClick={() => dispatch(fetchMyOrders())}
                className="mt-5 h-10 rounded-full bg-pine px-5 text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft"
              >
                Try again
              </button>
            </div>
          ) : orders.length === 0 ? (
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
                href="/products"
                className="mt-6 flex h-11 items-center gap-2 rounded-full bg-pine px-6 text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft"
              >
                Browse products
                <ArrowIcon className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-line">
              {recentOrders.map((order) => {
                const itemCount = order.items.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                );

                return (
                  <li key={order._id}>
                    <Link
                      href={`/orders/${order._id}`}
                      className="-mx-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl px-3 py-4 transition-colors hover:bg-ink/[0.03]"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-base font-semibold text-ink">
                            {orderNumber(order._id)}
                          </span>
                          <OrderStatusBadge status={order.status} />
                          <PaymentBadge payment={order.payment} />
                        </div>

                        <p className="mt-1 text-sm text-muted">
                          {formatOrderDate(order.createdAt)}
                          {" · "}
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </p>
                      </div>

                      <span className="shrink-0 font-display text-lg font-semibold text-ink">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {/* When everything already fits, the link belongs at the bottom
              rather than as a "view all" that shows nothing new. */}
          {orders.length > 0 && orders.length <= RECENT_LIMIT ? (
            <Link
              href="/orders"
              className="group mt-6 flex items-center gap-2 border-t border-line pt-5 text-sm font-semibold text-ink"
            >
              Go to your orders
              <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
