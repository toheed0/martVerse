"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import {
  canCancel,
  cancelOrder,
  fetchMyOrders,
} from "@/store/slices/orderSlice";
import OrderStatusBadge, {
  PaymentBadge,
  orderNumber,
} from "./OrderStatusBadge";
import ProductArt from "@/components/home/ProductArt";
import Alert from "@/components/ui/Alert";
import { ArrowIcon } from "@/components/ui/icons";
import { formatDate, formatPrice } from "@/lib/format";

export default function OrderList() {
  const dispatch = useDispatch();
  const { items, status, error, cancellingId, cancelError } = useSelector(
    (state) => state.orders
  );

  useEffect(() => {
    // Placing an order resets this to idle, so a fresh order shows up here
    // without a manual refresh.
    if (status === "idle") dispatch(fetchMyOrders());
  }, [status, dispatch]);

  return (
    // No page-level width or padding here: this sits inside the account grid
    // alongside the sidebar, and a second max-width would fight it.
    <div>
      <p className="eyebrow text-brass">Your account</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        Orders
      </h1>
      <p className="mt-3 text-muted">
        {status === "succeeded"
          ? items.length === 0
            ? "You haven't ordered anything yet"
            : `${items.length} ${items.length === 1 ? "order" : "orders"}`
          : "Loading..."}
      </p>

      <div className="mt-10 space-y-3">
        <Alert type="error">{cancelError}</Alert>

        {status === "loading" || status === "idle" ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-sand" />
          ))
        ) : status === "failed" ? (
          <div className="rounded-2xl border border-clay/30 bg-clay/5 px-6 py-10 text-center">
            <p className="font-display text-lg font-semibold text-ink">
              Couldn&apos;t load your orders
            </p>
            <p className="mt-2 text-sm text-muted">{error}</p>
            <button
              type="button"
              onClick={() => dispatch(fetchMyOrders())}
              className="mt-6 h-11 rounded-full bg-pine px-6 text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft"
            >
              Try again
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-20 text-center">
            <div className="opacity-40">
              <ProductArt name="bag" className="h-24 w-24 text-pine" />
            </div>
            <p className="mt-6 font-display text-2xl font-semibold text-ink">
              No orders yet
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
              Everything you buy shows up here, with the price you paid on the
              day you paid it.
            </p>
            <Link
              href="/products"
              className="group mt-8 flex items-center gap-2 text-sm font-semibold text-ink"
            >
              Start browsing
              <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        ) : (
          items.map((order) => {
            const itemCount = order.items.reduce(
              (sum, item) => sum + item.quantity,
              0
            );
            const isBusy = cancellingId === order._id;

            return (
              <div
                key={order._id}
                className="rounded-2xl border border-line bg-surface p-5 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="font-display text-lg font-semibold text-ink">
                        {orderNumber(order._id)}
                      </h2>
                      <OrderStatusBadge status={order.status} />
                      <PaymentBadge payment={order.payment} />
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {formatDate(order.createdAt)}
                      {" · "}
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>

                  <p className="font-display text-xl font-semibold text-ink">
                    {formatPrice(order.totalAmount)}
                  </p>
                </div>

                {/* The names are snapshots taken at checkout, so they still
                    read correctly even if the vendor renamed the product. */}
                <p className="mt-4 truncate border-t border-line pt-4 text-sm text-muted">
                  {order.items.map((item) => item.name).join(", ")}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link
                    href={`/orders/${order._id}`}
                    className="flex h-10 items-center rounded-full border border-ink/20 px-5 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink/5"
                  >
                    View order
                  </Link>

                  {canCancel(order) ? (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => dispatch(cancelOrder(order._id))}
                      className="h-10 rounded-full px-5 text-sm font-semibold text-clay transition-colors hover:bg-clay/10 disabled:opacity-50"
                    >
                      {isBusy ? "Cancelling..." : "Cancel order"}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
