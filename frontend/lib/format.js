// The storefront quotes everything in rupees, matching the announcement bar
// and the rest of the marketing copy.
export const formatPrice = (value) =>
  `Rs ${Number(value || 0).toLocaleString("en-PK")}`;

// Order dates read as "9 Sep 2026" rather than a locale-dependent slash date.
export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

// Stock is shown as a short status rather than a raw count, so a shopper sees
// urgency instead of inventory data.
export const stockLabel = (stock) => {
  if (stock <= 0) return { text: "Out of stock", tone: "out" };
  if (stock <= 5) return { text: `Only ${stock} left`, tone: "low" };
  return { text: "In stock", tone: "in" };
};
