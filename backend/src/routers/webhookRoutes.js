import express from "express";

import { stripeWebhookController } from "../controllers/webhookController.js";

const router = express.Router();

// No `protect` here, and that is deliberate. Stripe is not a signed-in user —
// it has neither a token nor a cookie — so the usual middleware would answer
// 401 to every event. The signature check inside the controller is what
// authenticates this route, and it is stricter than a bearer token: only
// someone holding the webhook secret can produce a valid one.
//
// express.raw keeps the body as the exact bytes Stripe signed. It sits on the
// route rather than in app.js so the requirement stays next to the handler that
// depends on it — but app.js still has to mount this router ABOVE its global
// express.json(), or that will have consumed the body long before we get here.
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhookController
);

export default router;
