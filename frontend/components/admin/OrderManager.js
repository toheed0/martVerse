"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import {
  canCancel,
  cancelOrder,
  fetchAdminOrders,
  nextStatuses,
  updateOrderStatus,
} from "@/store/slices/orderSlice";
import AdminTabs from "./AdminTabs";
import OrderStatusBadge, {
  PaymentBadge,
  orderNumber,
} from "@/components/orders/OrderStatusBadge";
import Alert from "@/components/ui/Alert";
import { formatDate, formatPrice } from "@/lib/format";

const PAGE_SIZE = 20;

const statusFilters = [
  "all",
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export default function OrderManager() {
  const dispatch = useDispatch();
  const {
    admin,
    adminPagination,
    adminStatus,
    adminError,
    updatingId,
    updateError,
    cancellingId,
    cancelError,
  } = useSelector((state) => state.orders);

  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    dispatch(
      fetchAdminOrders({
        page,
        limit: PAGE_SIZE,
        status: status === "all" ? undefined : status,
      })
    );
  }, [dispatch, page, status]);

  const { totalOrders = 0, totalPages = 0 } = adminPagination || {};

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
      <AdminTabs />

      <div className="mt-8">
        <p className="eyebrow text-brass">Admin</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Orders
        </h1>
        <p className="mt-3 text-muted">
          {adminStatus === "succeeded"
            ? `${totalOrders} ${
                totalOrders === 1 ? "order" : "orders"
              }${status === "all" ? " across every buyer" : ` ${status}`}`
            : "Loading..."}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-2">
        {statusFilters.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setStatus(value);
              setPage(1);
            }}
            className={`flex h-11 items-center rounded-full px-5 text-sm font-semibold capitalize transition-colors ${
              status === value
                ? "bg-pine text-canvas"
                : "border border-line text-muted hover:border-ink/30 hover:text-ink"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="mt-10 space-y-3">
        <Alert type="error">{updateError || cancelError}</Alert>

        {adminStatus === "loading" || adminStatus === "idle" ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-sand" />
          ))
        ) : adminStatus === "failed" ? (
          <Alert type="error">{adminError}</Alert>
        ) : admin.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
            <p className="font-display text-lg font-semibold text-ink">
              {status === "all" ? "No orders yet" : `No ${status} orders`}
            </p>
            <p className="mt-2 text-sm text-muted">
              Orders appear here the moment a buyer checks out.
            </p>
          </div>
        ) : (
          admin.map((order) => {
            const itemCount = order.items.reduce(
              (sum, item) => sum + item.quantity,
              0
            );
            const isBusy =
              updatingId === order._id || cancellingId === order._id;
            const moves = nextStatuses(order);

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
                      {/* A cancelled order still marked paid is a refund owed
                          by hand, and this list is where that gets noticed. */}
                      <PaymentBadge payment={order.payment} />
                    </div>

                    {/* The column that makes this different from a buyer's own
                        list — whose order this is. */}
                    <p className="mt-1 truncate text-sm text-muted">
                      <span className="font-semibold text-ink">
                        {order.userId?.name || "Unknown buyer"}
                      </span>
                      {order.userId?.email ? ` · ${order.userId.email}` : ""}
                    </p>

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

                {confirmingId === order._id ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                    <span className="text-sm text-muted">
                      Cancel this order and return the stock?
                    </span>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        dispatch(cancelOrder(order._id));
                        setConfirmingId(null);
                      }}
                      className="h-10 rounded-full bg-clay px-5 text-sm font-semibold text-white transition-colors hover:bg-clay/90 disabled:opacity-60"
                    >
                      {isBusy ? "Working..." : "Yes, cancel"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      className="h-10 rounded-full border border-ink/20 px-5 text-sm font-semibold text-ink transition-colors hover:bg-ink/5"
                    >
                      Keep it
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
                    <Link
                      href={`/orders/${order._id}`}
                      className="flex h-10 items-center rounded-full px-4 text-sm font-semibold text-muted transition-colors hover:bg-ink/5 hover:text-ink"
                    >
                      View
                    </Link>

                    {/* Built from the transition map, so a delivered order
                        simply offers nothing rather than a button that 400s. */}
                    {moves.map((next) => (
                      <button
                        key={next}
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          dispatch(
                            updateOrderStatus({ id: order._id, status: next })
                          )
                        }
                        className="h-10 rounded-full bg-pine px-5 text-sm font-semibold capitalize text-canvas transition-colors hover:bg-pine-soft disabled:opacity-60"
                      >
                        {isBusy ? "Working..." : `Mark ${next}`}
                      </button>
                    ))}

                    {canCancel(order) ? (
                      <button
                        type="button"
                        onClick={() => setConfirmingId(order._id)}
                        className="h-10 rounded-full px-5 text-sm font-semibold text-clay transition-colors hover:bg-clay/10"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 ? (
        <nav
          aria-label="Pagination"
          className="mt-8 flex items-center justify-center gap-3"
        >
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
            className="h-10 rounded-full border border-ink/20 px-5 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink/5 disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            className="h-10 rounded-full border border-ink/20 px-5 text-sm font-semibold text-ink transition-colors hover:border-ink hover:bg-ink/5 disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      ) : null}

      <p className="mt-8 rounded-xl border border-line bg-sand/60 px-5 py-4 text-xs leading-relaxed text-muted">
        Orders only move forward: pending to confirmed to shipped to delivered.
        Cancelling is the one action that changes stock — it puts every item back
        on the shelf — and it stops being offered once an order has shipped.
      </p>
    </div>
  );
}
