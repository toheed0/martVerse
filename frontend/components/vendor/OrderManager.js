"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchVendorOrders } from "@/store/slices/orderSlice";
import VendorTabs from "./VendorTabs";
import OrderStatusBadge, {
  orderNumber,
} from "@/components/orders/OrderStatusBadge";
import ProductArt from "@/components/home/ProductArt";
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
  const { vendor, vendorPagination, vendorStatus, vendorError } = useSelector(
    (state) => state.orders
  );

  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(
      fetchVendorOrders({
        page,
        limit: PAGE_SIZE,
        status: status === "all" ? undefined : status,
      })
    );
  }, [dispatch, page, status]);

  const { totalOrders = 0, totalPages = 0 } = vendorPagination || {};

  // Everything sold across the page being shown, not the whole account — say
  // exactly that rather than letting it read as lifetime revenue.
  const pageTotal = vendor.reduce((sum, order) => sum + order.vendorTotal, 0);

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-12 lg:px-8 lg:py-16">
      <VendorTabs />

      <div className="mt-8">
        <p className="eyebrow text-brass">Vendor</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Your sales
        </h1>
        <p className="mt-3 text-muted">
          {vendorStatus === "succeeded"
            ? totalOrders === 0
              ? "Nothing sold yet"
              : `${totalOrders} ${
                  totalOrders === 1 ? "order" : "orders"
                } contain your products`
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
        {vendorStatus === "loading" || vendorStatus === "idle" ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-sand" />
          ))
        ) : vendorStatus === "failed" ? (
          <Alert type="error">{vendorError}</Alert>
        ) : vendor.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-20 text-center">
            <div className="opacity-40">
              <ProductArt name="bag" className="h-24 w-24 text-pine" />
            </div>
            <p className="mt-6 font-display text-2xl font-semibold text-ink">
              {status === "all" ? "No sales yet" : `No ${status} orders`}
            </p>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
              Every order containing one of your products shows up here, with
              what you sold and what it came to.
            </p>
          </div>
        ) : (
          vendor.map((order) => {
            const itemCount = order.items.reduce(
              (sum, item) => sum + item.quantity,
              0
            );

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
                    </div>

                    <p className="mt-1 text-sm text-muted">
                      {order.buyer?.name || "Unknown buyer"}
                      {" · "}
                      {formatDate(order.createdAt)}
                      {" · "}
                      {itemCount} {itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-display text-xl font-semibold text-ink">
                      {formatPrice(order.vendorTotal)}
                    </p>
                    <p className="text-[0.7rem] tracking-[0.1em] uppercase text-muted">
                      Your share
                    </p>
                  </div>
                </div>

                {/* Only this vendor's lines — the API never sends the rest. */}
                <ul className="mt-4 space-y-2 border-t border-line pt-4">
                  {order.items.map((item, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between gap-4 text-sm"
                    >
                      <span className="min-w-0 truncate text-ink">
                        {item.name}
                        <span className="text-muted"> × {item.quantity}</span>
                      </span>
                      <span className="shrink-0 font-semibold text-ink">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>

                {order.hasOtherVendors ? (
                  <p className="mt-3 text-xs text-muted">
                    This order also contains items from another seller, so its
                    status covers more than your part of it.
                  </p>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {vendorStatus === "succeeded" && vendor.length > 0 ? (
        <div className="mt-8 flex items-end justify-between gap-4 rounded-2xl border border-line bg-surface p-6">
          <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted">
            This page
          </p>
          <p className="font-display text-2xl font-semibold text-ink">
            {formatPrice(pageTotal)}
          </p>
        </div>
      ) : null}

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
        This view is read-only. An order can hold items from several sellers, so
        its status belongs to the whole order and only an admin moves it —
        otherwise marking your part shipped would speak for everyone else too.
      </p>
    </div>
  );
}
