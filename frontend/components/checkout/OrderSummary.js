"use client";

import ProductImage from "@/components/products/ProductImage";
import ProductArt from "@/components/home/ProductArt";
import { formatPrice } from "@/lib/format";

// The same panel on both checkout steps, so the total never leaves the screen
// while a buyer is deciding or typing a card number.
//
// It takes already-flattened lines rather than reading the cart itself: placing
// an order empties the cart server-side, and by the payment step the only
// record of what was bought is the order's own snapshot.
export default function OrderSummary({ lines, total, locked = false }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <h2 className="font-display text-lg font-semibold text-ink">
        Order summary
      </h2>

      <ul className="mt-5 space-y-4">
        {lines.map((line) => (
          <li key={line.key} className="flex items-center gap-3">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-sand text-pine">
              {/* An order snapshot carries no images, so the house artwork
                  stands in rather than leaving an empty square. */}
              {line.product ? (
                <ProductImage product={line.product} artClassName="h-8 w-8" />
              ) : (
                <ProductArt name="bag" className="h-8 w-8" />
              )}

              <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-pine px-1 text-[0.65rem] font-semibold text-canvas">
                {line.quantity}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                {line.name}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {formatPrice(line.price)} each
              </p>
            </div>

            <p className="shrink-0 text-sm font-semibold text-ink">
              {formatPrice(line.price * line.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd className="font-semibold text-ink">{formatPrice(total)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Delivery</dt>
          <dd className="font-semibold text-pine">Free</dd>
        </div>
      </dl>

      <div className="mt-5 flex items-end justify-between border-t border-line pt-5">
        <p className="text-xs font-semibold tracking-[0.12em] uppercase text-muted">
          Total
        </p>
        <p className="font-display text-2xl font-semibold text-ink">
          {formatPrice(total)}
        </p>
      </div>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        {locked
          ? "These items are already held for you. Cancel the order to put them back."
          : "Prices are locked in at the moment you place the order."}
      </p>
    </div>
  );
}

// Cart rows and order rows describe the same thing in two shapes — the cart
// points at a live product, the order carries a copy taken at checkout. One
// normaliser here keeps the panel from having to know which it was handed.
export const cartLines = (items) =>
  items.map((item) => ({
    key: item.productId._id,
    name: item.productId.name,
    price: item.productId.price,
    quantity: item.quantity,
    product: item.productId,
  }));

export const orderLines = (order) =>
  order.items.map((item, index) => ({
    key: `${item.productId}-${index}`,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    product: null,
  }));
