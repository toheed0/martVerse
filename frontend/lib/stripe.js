import { loadStripe } from "@stripe/stripe-js";

const publishableKey =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// loadStripe injects a script tag, so it is called once here at module scope
// rather than inside a component. Every Elements tree then shares the one
// promise instead of each render pulling Stripe.js down again.
export const stripePromise = publishableKey
  ? loadStripe(publishableKey)
  : null;

// Without a key the card form cannot mount at all, so checkout offers cash on
// delivery only rather than a card option that dead-ends.
export const cardPaymentAvailable = Boolean(publishableKey);

// Stripe's own inputs are in an iframe and cannot inherit the page's CSS, so
// the palette is handed over explicitly. These are the same values globals.css
// defines — pine, ink, clay, line.
export const stripeAppearance = {
  theme: "flat",
  variables: {
    colorPrimary: "#1e3d33",
    colorBackground: "#ffffff",
    colorText: "#1a1714",
    colorTextSecondary: "#6b635a",
    colorDanger: "#b4664a",
    borderRadius: "12px",
    spacingUnit: "4px",
    fontSizeBase: "15px",
  },
  rules: {
    ".Input": {
      border: "1px solid #e4ddd2",
      boxShadow: "none",
      padding: "12px 14px",
    },
    ".Input:focus": {
      border: "1px solid #1e3d33",
      boxShadow: "none",
    },
    ".Label": {
      color: "#6b635a",
      fontSize: "0.72rem",
      fontWeight: "600",
      letterSpacing: "0.12em",
      textTransform: "uppercase",
    },
  },
};
