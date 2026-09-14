import stripe from "../config/stripe.js";

import {
  confirmPaymentByIntent,
  failPaymentByIntent,
  markRefundedByIntent,
} from "../services/orderService.js";

// Stripe waits about twenty seconds for an answer and treats anything slower as
// a failure worth retrying, so nothing slow belongs in here — no email, no
// invoice building. Record the fact and get out.
export const stripeWebhookController = async (req, res) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    // Without the secret nothing can be verified, and an unverified event is
    // just a stranger claiming an order was paid. Refuse rather than trust it.
    console.error(
      "STRIPE_WEBHOOK_SECRET is not set — a Stripe event arrived and could not be verified"
    );

    return res.status(500).json({
      success: false,
      message: "Webhook is not configured",
    });
  }

  let event;

  try {
    // req.body is a raw Buffer here, and has to be: Stripe signs the exact
    // bytes it sent. This route is mounted above express.json() in app.js for
    // that reason — parsed and re-serialised JSON will not match the signature.
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      secret
    );
  } catch (error) {
    // Unsigned, wrongly signed, or the body was parsed somewhere upstream.
    // A retry cannot fix any of those, so do not ask Stripe for one.
    console.error("Stripe webhook signature check failed:", error.message);

    return res.status(400).json({
      success: false,
      message: `Webhook signature check failed: ${error.message}`,
    });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const order = await confirmPaymentByIntent(event.data.object.id);

        // Says the order is paid, not that this event is what paid it — a
        // redelivery lands here too, and so does the event that arrives just
        // after the buyer's own confirm call already recorded the payment.
        console.log(
          order
            ? `Order ${order._id} is paid (Stripe event ${event.id})`
            : `Stripe event ${event.id} matched no order — ignored`
        );

        break;
      }

      case "payment_intent.payment_failed": {
        const order = await failPaymentByIntent(event.data.object.id);

        if (order) {
          console.log(
            `Order ${order._id} cancelled and its stock released after a failed payment`
          );
        }

        break;
      }

      case "payment_intent.canceled": {
        // Stripe gives up on an intent that was never completed, which is the
        // same outcome as a decline as far as the order is concerned.
        await failPaymentByIntent(event.data.object.id);
        break;
      }

      case "charge.refunded": {
        // charge, not payment_intent — the intent id is a field on it.
        const intentId = event.data.object.payment_intent;

        if (intentId) await markRefundedByIntent(intentId);

        break;
      }

      default:
        // Answer 200 anyway. Anything reaching here is an event this endpoint
        // was not built for, and a 400 would have Stripe redelivering it for
        // days over something that was never a problem.
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    // Our side broke — the database was unreachable, or a write threw. A 500
    // is the honest answer and it asks Stripe to deliver the event again.
    console.error(
      `Failed to handle Stripe event ${event.id} (${event.type})`,
      error
    );

    return res.status(500).json({
      success: false,
      message: "Could not process the event",
    });
  }
};
