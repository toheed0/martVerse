"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import {
  cancelOrder,
  confirmPayment,
  resetCheckout,
} from "@/store/slices/orderSlice";
import { fetchCart } from "@/store/slices/cartSlice";
import { orderNumber } from "@/components/orders/OrderStatusBadge";
import Alert from "@/components/ui/Alert";
import { stripeAppearance, stripePromise } from "@/lib/stripe";
import { formatPrice } from "@/lib/format";

// The half that lives inside <Elements> — useStripe and useElements only have
// anything to return from in there.
function PaymentForm({ order }) {
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();
  const router = useRouter();

  const { confirming, confirmError } = useSelector((state) => state.orders);

  // Stripe's own errors (declined card, incomplete field) never reach Redux —
  // they come back from confirmPayment right here.
  const [cardError, setCardError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [abandoning, setAbandoning] = useState(false);

  const busy = submitting || confirming || abandoning;

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Stripe.js is still downloading. Blocking here beats a click that looks
    // like it did nothing.
    if (!stripe || !elements) return;

    setCardError(null);
    setSubmitting(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      // Most cards finish without leaving the page; only the ones that need a
      // bank's 3-D Secure screen redirect, and those come back to return_url.
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/orders/${order._id}`,
      },
    });

    if (error) {
      setCardError(error.message);
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status !== "succeeded") {
      setCardError(
        `The payment did not complete (${paymentIntent?.status ?? "unknown"}). Try another card.`
      );
      setSubmitting(false);
      return;
    }

    // Stripe has the money, but only the server may say so on the order — it
    // re-reads the intent from Stripe rather than taking this call's word.
    const result = await dispatch(confirmPayment(order._id));

    setSubmitting(false);

    if (!result.error) router.push(`/orders/${order._id}`);
  };

  // Walking away from a placed order would leave its stock held and no way to
  // pay it, so leaving cancels it properly and puts the items back.
  const handleAbandon = async () => {
    setAbandoning(true);

    await dispatch(cancelOrder(order._id));
    dispatch(resetCheckout());

    // The cart was emptied when the order was placed and the cancel does not
    // refill it, so re-read rather than leave a stale copy on screen.
    dispatch(fetchCart());

    setAbandoning(false);
    router.push("/cart");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement options={{ layout: "tabs" }} />

      <Alert type="error">{cardError || confirmError}</Alert>

      <button
        type="submit"
        disabled={busy || !stripe}
        className="flex h-14 w-full items-center justify-center rounded-full bg-pine text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting
          ? "Contacting your bank..."
          : confirming
            ? "Confirming payment..."
            : `Pay ${formatPrice(order.totalAmount)}`}
      </button>

      <button
        type="button"
        disabled={busy}
        onClick={handleAbandon}
        className="h-11 w-full rounded-full text-sm font-semibold text-clay transition-colors hover:bg-clay/10 disabled:opacity-50"
      >
        {abandoning ? "Cancelling..." : "Cancel this order"}
      </button>

      <p className="text-center text-xs leading-relaxed text-muted">
        Card details go straight to Stripe — they never touch the MartVerse
        server.
      </p>
    </form>
  );
}

export default function PaymentStep({ order, clientSecret }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-semibold text-ink">
          Card payment
        </h2>
        <p className="text-sm text-muted">{orderNumber(order._id)}</p>
      </div>

      <p className="mt-2 mb-6 text-sm leading-relaxed text-muted">
        Your order is placed and the stock is held. It stays unpaid until this
        goes through.
      </p>

      {/* clientSecret is what ties this form to one specific payment, so it is
          passed at mount — Elements cannot be handed a different one later. */}
      <Elements
        stripe={stripePromise}
        options={{ clientSecret, appearance: stripeAppearance }}
      >
        <PaymentForm order={order} />
      </Elements>
    </div>
  );
}
