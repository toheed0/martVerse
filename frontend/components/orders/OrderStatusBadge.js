const styles = {
  pending: "border-brass/30 bg-brass/10 text-brass",
  confirmed: "border-pine/25 bg-pine/10 text-pine",
  shipped: "border-pine/25 bg-pine/10 text-pine",
  delivered: "border-pine/25 bg-pine/10 text-pine",
  cancelled: "border-clay/30 bg-clay/10 text-clay",
};

// Every status the Order model allows has an entry, so an unknown one means the
// enum grew without this list following it — fall back rather than render bare.
export default function OrderStatusBadge({ status }) {
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[0.62rem] font-semibold tracking-[0.12em] uppercase ${
        styles[status] ?? "border-line bg-sand text-muted"
      }`}
    >
      {status}
    </span>
  );
}

// Orders are identified by a Mongo id, which is far too long to read out. The
// tail is unique enough to tell two of your own orders apart.
export const orderNumber = (id = "") => `#${id.slice(-8).toUpperCase()}`;

const paymentStyles = {
  pending: "border-brass/30 bg-brass/10 text-brass",
  paid: "border-pine/25 bg-pine/10 text-pine",
  failed: "border-clay/30 bg-clay/10 text-clay",
  refunded: "border-line bg-sand text-muted",
};

// "Pending" on its own is ambiguous next to an order status that also says
// pending, so the method is spelled out with it — cash on delivery is meant to
// sit unpaid, a card order is not.
const paymentLabels = {
  cod: { pending: "Cash on delivery", paid: "Paid in cash" },
  stripe: { pending: "Card not paid", paid: "Paid by card" },
};

export function PaymentBadge({ payment }) {
  if (!payment) return null;

  const label =
    paymentLabels[payment.method]?.[payment.status] ??
    (payment.status === "refunded" ? "Refunded" : "Payment failed");

  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[0.62rem] font-semibold tracking-[0.12em] uppercase ${
        paymentStyles[payment.status] ?? "border-line bg-sand text-muted"
      }`}
    >
      {label}
    </span>
  );
}
