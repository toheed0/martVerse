"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { fetchCart, selectCartTotal } from "@/store/slices/cartSlice";
import { placeOrder } from "@/store/slices/orderSlice";
import OrderSummary, { cartLines, orderLines } from "./OrderSummary";
import PaymentStep from "./PaymentStep";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import ProductArt from "@/components/home/ProductArt";
import { ArrowIcon, ShieldIcon, TruckIcon } from "@/components/ui/icons";
import { cardPaymentAvailable } from "@/lib/stripe";

const EMPTY_ADDRESS = {
  fullName: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
};

// Mirrors the four the backend insists on. postalCode is left out on purpose —
// the Order model defaults it to an empty string.
const REQUIRED = {
  fullName: "Enter the name for the delivery",
  phone: "A phone number is needed for the courier",
  address: "Enter the street address",
  city: "Enter the city",
};

const methods = [
  {
    value: "cod",
    label: "Cash on delivery",
    hint: "Pay the courier when it arrives",
    Icon: TruckIcon,
  },
  {
    value: "stripe",
    label: "Card",
    hint: "Paid securely through Stripe",
    Icon: ShieldIcon,
  },
];

export default function CheckoutView() {
  const dispatch = useDispatch();
  const router = useRouter();

  const { items, status } = useSelector((state) => state.cart);
  const { placing, placeError, pendingPayment } = useSelector(
    (state) => state.orders
  );
  const { user } = useSelector((state) => state.auth);
  const total = useSelector(selectCartTotal);

  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [errors, setErrors] = useState({});
  const [method, setMethod] = useState("cod");

  useEffect(() => {
    if (status === "idle") dispatch(fetchCart());
  }, [status, dispatch]);

  // The signed-in name is the likeliest answer, and it stays editable — plenty
  // of orders are sent to someone else.
  useEffect(() => {
    if (user?.name) {
      setForm((current) =>
        current.fullName ? current : { ...current, fullName: user.name }
      );
    }
  }, [user]);

  const setField = (field) => (event) => {
    const { value } = event.target;

    setForm((current) => ({ ...current, [field]: value }));

    // Drop the complaint as soon as the buyer starts fixing it, rather than
    // leaving it up until the next submit.
    setErrors((current) =>
      current[field] ? { ...current, [field]: null } : current
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const found = {};

    for (const [field, message] of Object.entries(REQUIRED)) {
      if (!form[field].trim()) found[field] = message;
    }

    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }

    const result = await dispatch(
      placeOrder({ shippingAddress: form, paymentMethod: method })
    );

    if (result.error) return;

    // Cash on delivery is finished the moment the order exists. A card order
    // comes back with a clientSecret and stays here for the payment step.
    if (!result.payload.clientSecret) {
      router.push(`/orders/${result.payload.order._id}`);
    }
  };

  // The backend refuses the whole order if any line is no longer active, so
  // block the button rather than send a request that is certain to fail.
  const hasUnavailable = items.some(
    (item) => item.productId.status !== "active"
  );

  const loading = status === "loading" || status === "idle";

  const paying = Boolean(pendingPayment);

  // Placing the order empties the cart, so from the payment step onwards the
  // panel reads the order's own snapshot instead.
  const lines = paying ? orderLines(pendingPayment.order) : cartLines(items);

  const panelTotal = paying ? pendingPayment.order.totalAmount : total;

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="h-4 w-32 animate-pulse rounded bg-sand" />
        <div className="mt-6 h-12 w-72 animate-pulse rounded bg-sand" />
        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <div className="h-96 animate-pulse rounded-2xl bg-sand lg:col-span-7" />
          <div className="h-72 animate-pulse rounded-2xl bg-sand lg:col-span-5" />
        </div>
      </div>
    );
  }

  // An empty cart with no order in flight means there is nothing to check out.
  if (!paying && items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-2xl px-5 py-20 lg:py-28">
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-20 text-center">
          <div className="opacity-40">
            <ProductArt name="bag" className="h-24 w-24 text-pine" />
          </div>
          <p className="mt-6 font-display text-2xl font-semibold text-ink">
            Nothing to check out
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Add something to your bag and the checkout will be waiting here.
          </p>
          <Link
            href="/products"
            className="group mt-8 flex items-center gap-2 text-sm font-semibold text-ink"
          >
            Start browsing
            <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/cart" className="hover:text-ink">
          Bag
        </Link>
        <span>/</span>
        <span className={paying ? "" : "text-ink"}>Details</span>
        <span>/</span>
        <span className={paying ? "text-ink" : ""}>Payment</span>
      </nav>

      <p className="eyebrow mt-8 text-brass">Almost there</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        {paying ? "Pay for your order" : "Checkout"}
      </h1>
      <p className="mt-3 text-muted">
        {paying
          ? "One step left — your order is held until the card clears."
          : "Tell us where it goes and how you want to pay."}
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-7">
          {paying ? (
            <PaymentStep
              order={pendingPayment.order}
              clientSecret={pendingPayment.clientSecret}
            />
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-2xl border border-line bg-surface p-6 sm:p-8"
            >
              <h2 className="font-display text-xl font-semibold text-ink">
                Delivery address
              </h2>

              <div className="mt-6 space-y-5">
                <Input
                  id="fullName"
                  label="Full name"
                  autoComplete="name"
                  placeholder="Who is receiving it"
                  value={form.fullName}
                  onChange={setField("fullName")}
                  error={errors.fullName}
                />

                <Input
                  id="phone"
                  label="Phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="03xx xxxxxxx"
                  value={form.phone}
                  onChange={setField("phone")}
                  error={errors.phone}
                />

                <Input
                  id="address"
                  label="Street address"
                  autoComplete="street-address"
                  placeholder="House, street, area"
                  value={form.address}
                  onChange={setField("address")}
                  error={errors.address}
                />

                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    id="city"
                    label="City"
                    autoComplete="address-level2"
                    placeholder="Karachi"
                    value={form.city}
                    onChange={setField("city")}
                    error={errors.city}
                  />

                  <Input
                    id="postalCode"
                    label="Postal code (optional)"
                    autoComplete="postal-code"
                    placeholder="75500"
                    value={form.postalCode}
                    onChange={setField("postalCode")}
                  />
                </div>
              </div>

              <h2 className="mt-10 font-display text-xl font-semibold text-ink">
                Payment
              </h2>

              <div className="mt-6 space-y-3">
                {methods.map((option) => {
                  // Without a publishable key Stripe.js cannot mount a card
                  // form at all, so the option is shown as unavailable rather
                  // than leading to a step that never loads.
                  const disabled =
                    option.value === "stripe" && !cardPaymentAvailable;

                  const selected = method === option.value;

                  return (
                    <label
                      key={option.value}
                      className={`flex items-center gap-4 rounded-xl border p-4 transition-colors ${
                        disabled
                          ? "cursor-not-allowed border-line opacity-50"
                          : selected
                            ? "cursor-pointer border-pine bg-pine/5"
                            : "cursor-pointer border-line hover:border-ink/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={option.value}
                        checked={selected}
                        disabled={disabled}
                        onChange={() => setMethod(option.value)}
                        className="h-4 w-4 accent-pine"
                      />

                      <option.Icon className="h-5 w-5 shrink-0 text-pine" />

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink">
                          {option.label}
                        </span>
                        <span className="block text-xs text-muted">
                          {disabled
                            ? "Card payments are not configured on this store"
                            : option.hint}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="mt-6">
                <Alert type="error">{placeError}</Alert>
              </div>

              <button
                type="submit"
                disabled={placing || hasUnavailable}
                className="mt-4 flex h-14 w-full items-center justify-center rounded-full bg-pine text-sm font-semibold text-canvas transition-colors hover:bg-pine-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                {placing
                  ? "Placing order..."
                  : method === "stripe"
                    ? "Continue to payment"
                    : "Place order"}
              </button>

              <p className="mt-3 text-center text-xs text-muted">
                {hasUnavailable
                  ? "Something in your bag is no longer for sale — remove it first."
                  : "Stock is held the moment your order is placed."}
              </p>
            </form>
          )}
        </div>

        <div className="lg:sticky lg:top-8 lg:col-span-5">
          <OrderSummary lines={lines} total={panelTotal} locked={paying} />

          {!paying ? (
            <Link
              href="/cart"
              className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-muted transition-colors hover:text-ink"
            >
              Back to your bag
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
