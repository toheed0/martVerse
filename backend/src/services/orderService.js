import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import stripe from "../config/stripe.js";

// Statuses a buyer can still call back. Once something ships the stock has
// physically left, so returning it to the shelf would be a lie.
const CANCELLABLE = ["pending", "confirmed"];

// The storefront quotes rupees, so that is what Stripe should charge. It stays
// an env var because whether an account may present a given currency depends on
// where that account is registered — a test account that refuses PKR can be
// moved to USD without touching this file.
const CURRENCY = process.env.STRIPE_CURRENCY || "pkr";

// The forward half of the state machine. Cancelling is deliberately NOT here:
// it has to hand stock back, and that lives in cancelOrder. Two code paths that
// both touch stock is how inventory quietly goes wrong.
const FORWARD_TRANSITIONS = {
  pending: ["confirmed"],
  confirmed: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

// Who is allowed to touch a given order. An admin moderates every order; a
// buyer is always pinned to their own. One filter, so the callers below cannot
// drift apart the way three hand-written userId checks already did.
const scopedTo = (orderId, actor) =>
  actor.role === "admin"
    ? { _id: orderId }
    : { _id: orderId, userId: actor._id };

// Puts stock back on the shelf. This is the compensation half of the checkout:
// MongoDB transactions would express it more directly, but they need a replica
// set, and a local standalone mongod — what most dev setups run — cannot start
// one. Doing it by hand keeps the same guarantee on every deployment.
const releaseStock = async (claimed) => {
  for (const { productId, quantity } of claimed) {
    try {
      await Product.updateOne(
        { _id: productId },
        { $inc: { stock: quantity } }
      );
    } catch (error) {
      // Cleanup must never mask whatever went wrong first.
      console.error(
        `Failed to release ${quantity} of product ${productId}`,
        error
      );
    }
  }
};

// An order can hold items from several vendors, and totalAmount covers all of
// them. This builds the vendor's view from scratch rather than deleting fields
// off the order: a whitelist means a field added here later cannot leak by
// default, which a blacklist would.
const shapeForVendor = (order, vendorId) => {
  const mine = order.items.filter(
    (item) => String(item.vendorId) === String(vendorId)
  );

  return {
    _id: order._id,
    status: order.status,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,

    // Name only. The buyer's email is not the vendor's to have until there is a
    // shipping address to go with it.
    buyer: order.userId ? { name: order.userId.name } : null,

    items: mine,
    vendorTotal: mine.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    ),

    // Explains why the order status may not match what this vendor did, without
    // revealing who the other seller is or what they sold.
    hasOtherVendors: mine.length !== order.items.length,
  };
};

// Turns "why did the decrement not match?" into something a buyer can act on.
const describeUnavailable = async (productId, quantity) => {
  const product = await Product.findById(productId).select("name status stock");

  if (!product || product.status !== "active") {
    return `Product ${productId} is no longer available`;
  }

  return `Insufficient stock for product: ${product.name} (${product.stock} left, you asked for ${quantity})`;
};

// Checkout. Stock is claimed one line at a time with a conditional update, and
// anything that fails afterwards hands back exactly what this call took — the
// compensation pattern the rest of this file is built on.
export const createOrder = async (
  userId,
  shippingAddress,
  paymentMethod
) => {
  if (!["stripe", "cod"].includes(paymentMethod)) {
    throw new Error("Invalid payment method");
  }

  // Named so the buyer is told which box to go back and fill, rather than
  // being sent away with a blanket "address is required".
  const missing = ["fullName", "phone", "address", "city"].filter(
    (field) => !shippingAddress?.[field]?.trim()
  );

  if (missing.length) {
    throw new Error(
      `Shipping address is missing: ${missing.join(", ")}`
    );
  }

  const cart = await Cart.findOne({ userId });

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  // Everything taken off the shelf so far, so the catch below knows exactly
  // what to put back — including on the line that failed halfway through.
  const claimed = [];
  const orderItems = [];
  let totalAmount = 0;
  let order = null;

  try {
    for (const item of cart.items) {
      // The quantity is part of the FILTER, not a check before the write. A
      // findOne-then-save pair leaves a gap between reading the stock and
      // decrementing it, and that gap is exactly where two buyers both get
      // the last unit. One conditional update has no gap to race in.
      const product = await Product.findOneAndUpdate(
        {
          _id: item.productId,
          status: "active",
          stock: { $gte: item.quantity },
        },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!product) {
        // No match means sold out, withdrawn or deleted, and the buyer cannot
        // act on "no match" — so go and find out which it was.
        throw new Error(
          await describeUnavailable(item.productId, item.quantity)
        );
      }

      claimed.push({
        productId: product._id,
        quantity: item.quantity,
      });

      orderItems.push({
        productId: product._id,
        vendorId: product.vendorId,

        // Copied, not referenced. A rename or a price change next week must
        // not rewrite what this buyer agreed to today.
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });

      // Priced from the product row, never from anything the client sent.
      totalAmount += product.price * item.quantity;
    }

    order = await Order.create({
      userId,

      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone.trim(),
        address: shippingAddress.address.trim(),
        city: shippingAddress.city.trim(),
        postalCode: shippingAddress.postalCode?.trim() || "",
      },

      items: orderItems,
      totalAmount,

      payment: {
        method: paymentMethod,
        status: "pending",
      },

      status: "pending",
    });

    let clientSecret = null;

    if (paymentMethod === "stripe") {
      const intent = await stripe.paymentIntents.create({
        // Stripe counts in the currency's smallest unit, so rupees have to be
        // sent as paisa. Rounding keeps a floating-point 1098.9999 from being
        // truncated down to one paisa less than the buyer owes.
        amount: Math.round(totalAmount * 100),
        currency: CURRENCY,
        automatic_payment_methods: { enabled: true },

        // The order id rides along on Stripe's own record. Without it a
        // payment that arrives later — through a webhook, or through the
        // dashboard — cannot be matched back to anything here.
        metadata: {
          orderId: order._id.toString(),
          userId: userId.toString(),
        },
      });

      order.payment.stripePaymentIntentId = intent.id;
      await order.save();

      clientSecret = intent.client_secret;
    }

    // The order exists and the stock is gone, so failing to empty the cart is
    // no longer worth undoing any of that for. Worst case the buyer sees rows
    // they have already bought and clears them by hand.
    try {
      cart.items = [];
      await cart.save();
    } catch (error) {
      console.error(
        `Order ${order._id} was placed but cart ${cart._id} was not cleared`,
        error
      );
    }

    return { order, clientSecret };
  } catch (error) {
    // An order that never got its payment intent would sit in the buyer's
    // history as a thing they cannot pay for or read a total from.
    if (order) {
      await Order.deleteOne({ _id: order._id }).catch((cleanupError) =>
        console.error(
          `Failed to remove abandoned order ${order._id}`,
          cleanupError
        )
      );
    }

    await releaseStock(claimed);

    throw error;
  }
};

// Called by the buyer's browser once Stripe says the card went through. The
// status is read back FROM Stripe rather than believed from the request, so a
// forged "it's paid" call moves nothing.
// The one write that turns a card order into a paid one. Two things race to
// call it — the buyer's browser the moment Stripe.js returns, and Stripe's
// webhook a second or two later — and either may arrive first, so it has to be
// safe to run twice and safe to lose.
const markPaid = async (order) => {
  // Filtered on the state that was just read, so a cancel landing at the same
  // moment either wins or loses cleanly rather than both writes going through
  // and leaving a cancelled order marked paid.
  const paid = await Order.findOneAndUpdate(
    {
      _id: order._id,
      status: "pending",
      "payment.status": "pending",
    },
    {
      "payment.status": "paid",
      status: "confirmed",
    },
    { new: true }
  );

  if (paid) return paid;

  // The filter missed, so something moved this order between the read and the
  // write. Re-read rather than assume failure: the usual cause is the other
  // half of the pair getting there first, and that is success, not an error.
  // Reporting it as one would have the webhook answer 400 and Stripe retry a
  // payment that is already recorded.
  const current = await Order.findById(order._id);

  if (current?.payment.status === "paid") return current;

  throw new Error(
    `This order is ${current?.status ?? "no longer here"} and can no longer be marked paid`
  );
};

export const confirmOrderPayment = async (orderId, actor) => {
  const order = await Order.findOne(scopedTo(orderId, actor));

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.payment.method !== "stripe") {
    throw new Error("This order is not paid by card");
  }

  // The browser can call this twice — a retry, a refresh on the return leg —
  // and the second call must not be an error.
  if (order.payment.status === "paid") {
    return order;
  }

  if (!order.payment.stripePaymentIntentId) {
    throw new Error("This order has no card payment to confirm");
  }

  const intent = await stripe.paymentIntents.retrieve(
    order.payment.stripePaymentIntentId
  );

  if (intent.status !== "succeeded") {
    throw new Error(
      `The card payment has not completed (Stripe reports: ${intent.status})`
    );
  }

  return markPaid(order);
};

// ---------------------------------------------------------------------------
// Entered from Stripe's webhook rather than from a signed-in request. There is
// no actor to scope by here — the event's signature is what proved it genuine,
// and that is checked in the controller before any of this runs.
//
// Each of these is keyed on the payment intent rather than on metadata: we
// wrote that id onto the order ourselves, so it holds even for an event Stripe
// raises about a payment we never saw finish.
// ---------------------------------------------------------------------------

// Stripe confirming the money actually arrived. This is the authority on a card
// order being paid; the buyer's own confirm call is only a head start on it.
export const confirmPaymentByIntent = async (intentId) => {
  const order = await Order.findOne({
    "payment.stripePaymentIntentId": intentId,
  });

  // An intent with no order behind it — a payment created outside this app, or
  // one whose order was already swept away. Retrying will not conjure it up,
  // so this reads as handled rather than failed.
  if (!order) return null;

  if (order.payment.status === "paid") return order;

  return markPaid(order);
};

// The card was declined, or the buyer failed authentication. The order is dead
// and the stock it is holding has to go back on the shelf.
export const failPaymentByIntent = async (intentId) => {
  // One conditional flip does the check and the claim together, so a duplicate
  // delivery of the same event finds nothing to do and says so with null.
  const order = await Order.findOneAndUpdate(
    {
      "payment.stripePaymentIntentId": intentId,
      status: "pending",
      "payment.status": "pending",
    },
    {
      status: "cancelled",
      "payment.status": "failed",
    },
    { new: true }
  );

  if (!order) return null;

  await releaseStock(
    order.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }))
  );

  return order;
};

// Money went back to the card. cancelOrder already sets this itself when it
// refunds, and its write lands first — so in practice this catches the refunds
// issued by hand from the Stripe dashboard, which nothing else here would see.
//
// The order's own status is deliberately left alone: Stripe raises this for a
// partial refund too, and a partial refund is not a cancellation.
export const markRefundedByIntent = async (intentId) => {
  const order = await Order.findOneAndUpdate(
    {
      "payment.stripePaymentIntentId": intentId,
      "payment.status": "paid",
    },
    { "payment.status": "refunded" },
    { new: true }
  );

  return order;
};

// Card orders that were placed and then walked away from. Stripe raises no
// event for a payment that simply never happened, so nothing above will ever
// free the stock these are holding — this is the only thing that does.
export const cancelAbandonedCardOrders = async (olderThanMinutes = 30) => {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);

  const stale = await Order.find({
    status: "pending",
    "payment.method": "stripe",
    "payment.status": "pending",
    createdAt: { $lt: cutoff },
  }).select("_id payment.stripePaymentIntentId");

  let cancelled = 0;

  for (const order of stale) {
    const intentId = order.payment.stripePaymentIntentId;

    if (intentId) {
      try {
        // Cancelling at Stripe FIRST is what makes this safe. Stripe refuses to
        // cancel an intent that already succeeded, so a buyer who paid moments
        // ago throws us out here and keeps their order — rather than having it
        // cancelled out from under them by a clock.
        await stripe.paymentIntents.cancel(intentId);
      } catch (error) {
        console.error(
          `Leaving order ${order._id} alone — Stripe would not cancel intent ${intentId}`,
          error.message
        );
        continue;
      }
    }

    const flipped = await Order.findOneAndUpdate(
      {
        _id: order._id,
        status: "pending",
        "payment.status": "pending",
      },
      {
        status: "cancelled",
        "payment.status": "failed",
      },
      { new: true }
    );

    if (!flipped) continue;

    await releaseStock(
      flipped.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }))
    );

    cancelled += 1;
  }

  return cancelled;
};

export const cancelOrder = async (orderId, actor) => {
  // Flipping the status atomically is what stops two cancels — or a cancel
  // racing an admin marking the order shipped — from each acting on it.
  const order = await Order.findOneAndUpdate(
    {
      ...scopedTo(orderId, actor),
      status: { $in: CANCELLABLE },
    },
    { status: "cancelled" },
    { new: true }
  );

  if (!order) {
    // Say which of the three it was instead of a blanket "not found".
    const existing = await Order.findOne(scopedTo(orderId, actor)).select(
      "status"
    );

    if (!existing) {
      throw new Error("Order not found");
    }

    if (existing.status === "cancelled") {
      throw new Error("Order is already cancelled");
    }

    throw new Error(
      `An order that is already ${existing.status} cannot be cancelled`
    );
  }

  await releaseStock(
    order.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }))
  );

  // A card order that was already paid has the buyer's money sitting in
  // Stripe. Cancelling without sending it back would be taking payment for
  // something that is not being shipped.
  if (
    order.payment.method === "stripe" &&
    order.payment.status === "paid" &&
    order.payment.stripePaymentIntentId
  ) {
    try {
      await stripe.refunds.create({
        payment_intent: order.payment.stripePaymentIntentId,
      });

      order.payment.status = "refunded";
      await order.save();
    } catch (error) {
      // The cancellation itself already went through and cannot be taken
      // back, so this is logged loudly instead of thrown. payment.status
      // stays "paid" on a cancelled order, which is precisely the pair an
      // admin needs to see to know a refund is owed by hand.
      console.error(
        `Order ${order._id} was cancelled but the refund failed — refund it manually in Stripe`,
        error
      );
    }
  }

  return order;
};

// Admin only. Stock is untouched here by design: moving an order forward does
// not change what is on the shelf, and moving it to "cancelled" has to go
// through cancelOrder so the stock is handed back exactly once.
export const updateOrderStatus = async (orderId, nextStatus) => {
  const current = await Order.findById(orderId).select("status");

  if (!current) {
    throw new Error("Order not found");
  }

  const allowed = FORWARD_TRANSITIONS[current.status] ?? [];

  if (!allowed.includes(nextStatus)) {
    throw new Error(
      allowed.length
        ? `An order that is ${current.status} can only move to: ${allowed.join(", ")}`
        : `An order that is ${current.status} cannot change status`
    );
  }

  // The status we just read goes into the FILTER, not only the check above.
  // Two admins acting at once would otherwise both pass the check, and the
  // second write would happily move a just-cancelled order to "shipped".
  const order = await Order.findOneAndUpdate(
    { _id: orderId, status: current.status },
    { status: nextStatus },
    { new: true }
  ).populate("userId", "name email");

  if (!order) {
    throw new Error(
      "This order changed while you were working on it — reload and try again"
    );
  }

  return order;
};

export const getMyOrders = async (userId) => {
  const orders = await Order.find({ userId })
    .populate("items.productId", "name images")
    .sort({ createdAt: -1 });

  return orders;
};

// The admin moderation list: orders across every buyer, paginated because
// unlike the vendor list this collection only ever grows. Items are left
// unpopulated — the list shows totals and counts, and the snapshot name already
// lives on the order, so there is nothing to join for.
export const getOrdersForAdmin = async ({
  page = 1,
  limit = 20,
  status,
  userId,
}) => {
  const skip = (page - 1) * limit;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (userId) {
    filter.userId = userId;
  }

  const [orders, totalOrders] = await Promise.all([
    Order.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Order.countDocuments(filter),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
    },
  };
};

// A vendor's own sales. Read-only by design: the status belongs to the whole
// order, which may span several vendors, so no single vendor can own it.
// Cancelling is likewise out of reach — it would return every vendor's stock.
export const getVendorOrders = async (
  vendorId,
  { page = 1, limit = 20, status } = {}
) => {
  const skip = (page - 1) * limit;

  const filter = { "items.vendorId": vendorId };

  if (status) {
    filter.status = status;
  }

  const [orders, totalOrders] = await Promise.all([
    Order.find(filter)
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      // Plain objects, so nothing can be handed back by accident — a Mongoose
      // document would carry totalAmount and every other vendor's items along
      // with it.
      .lean(),

    Order.countDocuments(filter),
  ]);

  return {
    orders: orders.map((order) => shapeForVendor(order, vendorId)),
    pagination: {
      page,
      limit,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
    },
  };
};

export const getOrderById = async (orderId, actor) => {
  const order = await Order.findOne(scopedTo(orderId, actor))
    .populate("items.productId", "name images")
    .populate("userId", "name email");

  if (!order) {
    throw new Error("Order not found");
  }

  return order;
};
