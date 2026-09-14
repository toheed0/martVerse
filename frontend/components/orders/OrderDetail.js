"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  canCancel,
  cancelOrder,
  fetchOrderById,
} from "@/store/slices/orderSlice";
import OrderStatusBadge, {
  PaymentBadge,
  orderNumber,
} from "./OrderStatusBadge";
import ProductImage from "@/components/products/ProductImage";
import ProductArt from "@/components/home/ProductArt";
import Alert from "@/components/ui/Alert";
import { ArrowIcon } from "@/components/ui/icons";
import { formatDate, formatPrice } from "@/lib/format";

export default function OrderDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { current, currentStatus, currentError, cancellingId, cancelError } =
    useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

  // Shared between a buyer reading their own order and an admin moderating it.
  const isAdmin = user?.role === "admin";
  const backHref = isAdmin ? "/admin/orders" : "/orders";

  useEffect(() => {
    if (id) dispatch(fetchOrderById(id));
  }, [id, dispatch]);

  if (currentStatus === "loading" || currentStatus === "idle") {
    return (
      <div className="mx-auto w-full max-w-4xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="h-4 w-40 animate-pulse rounded bg-sand" />
        <div className="mt-6 h-10 w-64 animate-pulse rounded bg-sand" />
        <div className="mt-10 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-sand" />
          ))}
        </div>
      </div>
    );
  }

  // The API answers 404 both for an id that does not exist and for an order
  // belonging to someone else, which is exactly what it should say either way.
  if (currentStatus === "failed") {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-24">
        <div className="max-w-sm text-center">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Order not found
          </h1>
          <p className="mt-3 leading-relaxed text-muted">{currentError}</p>
          <Link
            href={backHref}
            className="mt-8 inline-flex h-12 items-center rounded-full bg-pine px-7 text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft"
          >
            {isAdmin ? "Back to orders" : "Back to your orders"}
          </Link>
        </div>
      </div>
    );
  }

  const isBusy = cancellingId === current._id;
  const itemCount = current.items.reduce((sum, item) => sum + item.quantity, 0);

  // A card order whose payment never went through. The buyer abandoned the
  // Stripe step, and the clientSecret that would have resumed it is gone with
  // the page they left — so the honest advice is to cancel and start again.
  const unpaidCard =
    current.payment?.method === "stripe" &&
    current.payment?.status === "pending" &&
    current.status !== "cancelled";

  return (
    <div className="mx-auto w-full max-w-4xl px-5 py-12 lg:px-8 lg:py-16">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link
          href={isAdmin ? "/admin/categories" : "/profile"}
          className="hover:text-ink"
        >
          {isAdmin ? "Admin" : "Account"}
        </Link>
        <span>/</span>
        <Link href={backHref} className="hover:text-ink">
          Orders
        </Link>
        <span>/</span>
        <span className="text-ink">{orderNumber(current._id)}</span>
      </nav>

      <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">
              {orderNumber(current._id)}
            </h1>
            <OrderStatusBadge status={current.status} />
            <PaymentBadge payment={current.payment} />
          </div>
          <p className="mt-3 text-muted">
            Placed {formatDate(current.createdAt)}
            {" · "}
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>

          {/* A buyer already knows whose order this is; an admin does not. */}
          {isAdmin && current.userId ? (
            <p className="mt-1 text-muted">
              <span className="font-semibold text-ink">
                {current.userId.name}
              </span>
              {current.userId.email ? ` · ${current.userId.email}` : ""}
            </p>
          ) : null}
        </div>

        {canCancel(current) ? (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => dispatch(cancelOrder(current._id))}
            className="h-11 rounded-full border border-clay/40 px-5 text-sm font-semibold text-clay transition-colors hover:bg-clay/10 disabled:opacity-50"
          >
            {isBusy ? "Cancelling..." : "Cancel order"}
          </button>
        ) : null}
      </div>

      <div className="mt-8 space-y-3">
        <Alert type="error">{cancelError}</Alert>

        {current.items.map((item, index) => {
          // Populated for a product that still exists, null once one has been
          // deleted outright. The name and price below are the order's own
          // snapshot either way, so the row never loses its meaning.
          const product = item.productId;

          return (
            <div
              key={index}
              className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-sand text-pine">
                  {product ? (
                    <ProductImage product={product} artClassName="h-9 w-9" />
                  ) : (
                    <ProductArt name="bag" className="h-9 w-9" />
                  )}
                </div>

                <div className="min-w-0">
                  {product ? (
                    <Link
                      href={`/products/${product._id}`}
                      className="font-display text-lg font-semibold text-ink hover:text-pine"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <h2 className="font-display text-lg font-semibold text-ink">
                      {item.name}
                    </h2>
                  )}

                  <p className="mt-1 text-sm text-muted">
                    {formatPrice(item.price)} × {item.quantity}
                  </p>
                </div>
              </div>

              <p className="shrink-0 text-sm font-semibold text-ink">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-6">
          <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted">
            Delivering to
          </p>

          {current.shippingAddress ? (
          <address className="mt-4 text-sm leading-relaxed text-ink not-italic">
            <span className="font-semibold">
              {current.shippingAddress?.fullName}
            </span>
            <br />
            {current.shippingAddress?.address}
            <br />
            {current.shippingAddress?.city}
            {current.shippingAddress?.postalCode
              ? ` ${current.shippingAddress?.postalCode}`
              : ""}
            <br />
            <span className="text-muted">
              {current.shippingAddress?.phone}
            </span>
          </address>
          ) : (
            <p className="mt-4 text-sm text-muted">
              This order was placed before delivery addresses were collected.
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6">
          <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted">
            Payment
          </p>

          <p className="mt-4 text-sm font-semibold text-ink">
            {current.payment?.method === "cod"
              ? "Cash on delivery"
              : "Card, through Stripe"}
          </p>

          <p className="mt-2 text-sm leading-relaxed text-muted">
            {current.payment?.method === "cod"
              ? "Pay the courier the full amount when your order arrives."
              : unpaidCard
                ? "This card payment never completed, so the order is still unpaid. Cancel it and order again to retry."
                : current.payment?.status === "refunded"
                  ? "Cancelled and refunded to the card it was paid with."
                  : "Paid in full — nothing is owed on delivery."}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex items-end justify-between gap-4">
          <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted">
            {current.payment?.status === "paid" ? "Total paid" : "Order total"}
          </p>
          <p className="font-display text-3xl font-semibold text-ink">
            {formatPrice(current.totalAmount)}
          </p>
        </div>

        <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-muted">
          Prices are recorded as they were at checkout, so a later change by the
          vendor never rewrites what you agreed to pay. Cancelling puts the
          items back in stock.
        </p>
      </div>

      <Link
        href={backHref}
        className="group mt-10 flex items-center gap-2 text-sm font-semibold text-ink"
      >
        {isAdmin ? "Back to orders" : "Back to your orders"}
        <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}
