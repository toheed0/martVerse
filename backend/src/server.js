// Must stay the first import. ESM evaluates imports in the order they are
// written, and app.js pulls in modules that read process.env the moment they
// load — the Cloudinary config and the auth cookie options both do. Move this
// below the app import and those read an empty environment.
import "dotenv/config";

import { connectDB } from "./config/db.js";
import app from "./app.js";
import { cancelAbandonedCardOrders } from "./services/orderService.js";

const requiredEnv = ["MONGO_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);

if (missingEnv.length) {
  console.error(`Missing env variables: ${missingEnv.join(", ")}`);
  process.exit(1);
}

connectDB();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// A buyer who reaches the card form and then closes the tab leaves an order
// holding stock that nothing will ever release: no payment happened, so Stripe
// raises no event about it. The webhook cannot cover this case — only a clock
// can.
const SWEEP_INTERVAL_MS = 15 * 60 * 1000;

const sweepAbandonedOrders = async () => {
  try {
    const cancelled = await cancelAbandonedCardOrders();

    if (cancelled) {
      console.log(`Released ${cancelled} abandoned card order(s)`);
    }
  } catch (error) {
    // A failed sweep is not worth taking the server down for; the next one is
    // fifteen minutes away and will pick up everything this one missed.
    console.error("Failed to sweep abandoned card orders", error);
  }
};

// unref so this timer alone never holds the process open on shutdown.
setInterval(sweepAbandonedOrders, SWEEP_INTERVAL_MS).unref();
