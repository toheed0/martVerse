import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { getErrorMessage } from "@/lib/api";
import { logout } from "./authSlice";

// What the backend still lets a buyer call back. Kept in step with CANCELLABLE
// in orderService.js — once something ships the stock has physically left.
const CANCELLABLE = ["pending", "confirmed"];

export const canCancel = (order) => CANCELLABLE.includes(order?.status);

// Mirror of FORWARD_TRANSITIONS in orderService.js. The backend is what
// enforces the state machine — this only stops the UI offering a move that is
// certain to be rejected.
const FORWARD_TRANSITIONS = {
  pending: ["confirmed"],
  confirmed: ["shipped"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export const nextStatuses = (order) =>
  FORWARD_TRANSITIONS[order?.status] ?? [];

// Checkout. Nothing about the cart is sent: the server reads it from the
// database and prices the order from live product rows, so the client cannot
// talk it into a cheaper total. Only where to ship it and how it is being paid
// for have to travel.
export const placeOrder = createAsyncThunk(
  "orders/place",
  async ({ shippingAddress, paymentMethod }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/orders", {
        shippingAddress,
        paymentMethod,
      });

      // clientSecret is null for cash on delivery — that order is already done.
      return { order: data.order, clientSecret: data.clientSecret };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// The last leg of a card checkout, sent once Stripe.js reports the card
// cleared. It carries nothing: the server re-reads the payment from Stripe, so
// this call cannot talk an unpaid order into looking paid.
export const confirmPayment = createAsyncThunk(
  "orders/confirmPayment",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/orders/${id}/pay`);
      return data.order;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  "orders/fetchMine",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/orders");
      return data.orders;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  "orders/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      return data.order;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const cancelOrder = createAsyncThunk(
  "orders/cancel",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/orders/${id}/cancel`);
      return data.order;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Admin only: orders across every buyer, filtered and paged server-side.
export const fetchAdminOrders = createAsyncThunk(
  "orders/fetchForAdmin",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/orders/admin", { params });
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Fulfilment only — the backend refuses anything that is not a legal forward
// move, and refuses "cancelled" outright since that has to release stock.
export const updateOrderStatus = createAsyncThunk(
  "orders/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/orders/${id}/status`, { status });
      return data.order;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// Vendor only. The response is already narrowed to this vendor's own lines and
// carries a vendorTotal instead of the buyer's grand total, so nothing here has
// to filter or re-sum anything.
export const fetchVendorOrders = createAsyncThunk(
  "orders/fetchForVendor",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/orders/vendor", { params });
      return data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  items: [],
  status: "idle", // idle | loading | succeeded | failed
  error: null,

  current: null,
  currentStatus: "idle",
  currentError: null,

  placing: false,
  placeError: null,

  // Set only for a card order, and only between placing it and Stripe
  // clearing it — the checkout page reads this to know it owes a payment step.
  pendingPayment: null,
  confirming: false,
  confirmError: null,

  cancellingId: null,
  cancelError: null,

  // Admin moderation list.
  admin: [],
  adminPagination: { page: 1, limit: 20, totalOrders: 0, totalPages: 0 },
  adminStatus: "idle",
  adminError: null,
  // Filters change fast, so only the newest response may write to state.
  adminRequestId: null,

  updatingId: null,
  updateError: null,

  // Vendor sales list — read-only, so it needs no action state of its own.
  vendor: [],
  vendorPagination: { page: 1, limit: 20, totalOrders: 0, totalPages: 0 },
  vendorStatus: "idle",
  vendorError: null,
  vendorRequestId: null,
};

// A status change can land while the buyer list, the admin list or the detail
// page is open, so all three are kept in step from one place.
const patchEverywhere = (state, updated) => {
  // Only the fields a status change can actually move. The responses behind
  // this carry no populated products, so spreading the whole thing in would
  // replace good rows with bare ids. `payment` is here because confirming a
  // card and refunding a cancellation both land on it.
  const merge = (order) => ({
    ...order,
    status: updated.status,
    payment: updated.payment ?? order.payment,
    updatedAt: updated.updatedAt,
  });

  for (const list of [state.items, state.admin]) {
    const index = list.findIndex((order) => order._id === updated._id);
    if (index !== -1) list[index] = merge(list[index]);
  }

  if (state.current?._id === updated._id) {
    state.current = merge(state.current);
  }
};

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearOrderFeedback: (state) => {
      state.placeError = null;
      state.cancelError = null;
      state.updateError = null;
      state.confirmError = null;
    },

    // Leaving checkout, or starting it again, must not carry an old Stripe
    // handle along — that secret belongs to one specific order.
    resetCheckout: (state) => {
      state.pendingPayment = null;
      state.placeError = null;
      state.confirmError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeOrder.pending, (state) => {
        state.placing = true;
        state.placeError = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.placing = false;

        const { order, clientSecret } = action.payload;

        // A card order is not finished yet. The whole order is parked here,
        // not just its id: placing it empties the cart, so this is the only
        // record the payment step has of what is being paid for.
        state.pendingPayment = clientSecret
          ? { order, clientSecret }
          : null;

        // The create response carries no populated products. Seeding `current`
        // with it would flash a half-drawn order before the detail page's own
        // fetch lands, so both lists are simply marked stale instead.
        state.current = null;
        state.currentStatus = "idle";
        state.status = "idle";
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.placing = false;
        state.placeError = action.payload;
      })

      .addCase(confirmPayment.pending, (state) => {
        state.confirming = true;
        state.confirmError = null;
      })
      .addCase(confirmPayment.fulfilled, (state, action) => {
        state.confirming = false;
        // Paid and done — the handle has nothing left to unlock.
        state.pendingPayment = null;
        patchEverywhere(state, action.payload);
        state.status = "idle";
      })
      .addCase(confirmPayment.rejected, (state, action) => {
        state.confirming = false;
        // Deliberately kept: the card may well have gone through, and the
        // buyer needs the step still on screen to retry rather than a
        // checkout that silently reset itself.
        state.confirmError = action.payload;
      })

      .addCase(fetchMyOrders.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(fetchOrderById.pending, (state) => {
        state.currentStatus = "loading";
        state.currentError = null;
        state.current = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.currentStatus = "succeeded";
        state.current = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.currentStatus = "failed";
        state.currentError = action.payload;
      })

      .addCase(cancelOrder.pending, (state, action) => {
        state.cancellingId = action.meta.arg;
        state.cancelError = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.cancellingId = null;
        // The response carries no populated products, so only the fields that
        // actually changed are merged in — the rows keep their own items.
        patchEverywhere(state, action.payload);
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.cancellingId = null;
        state.cancelError = action.payload;
      })

      .addCase(fetchAdminOrders.pending, (state, action) => {
        state.adminStatus = "loading";
        state.adminError = null;
        state.adminRequestId = action.meta.requestId;
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        if (state.adminRequestId !== action.meta.requestId) return;
        state.adminStatus = "succeeded";
        state.admin = action.payload.orders;
        state.adminPagination = action.payload.pagination;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        if (state.adminRequestId !== action.meta.requestId) return;
        state.adminStatus = "failed";
        state.adminError = action.payload;
      })

      .addCase(updateOrderStatus.pending, (state, action) => {
        state.updatingId = action.meta.arg.id;
        state.updateError = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.updatingId = null;
        patchEverywhere(state, action.payload);
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.updatingId = null;
        state.updateError = action.payload;
      })

      .addCase(fetchVendorOrders.pending, (state, action) => {
        state.vendorStatus = "loading";
        state.vendorError = null;
        state.vendorRequestId = action.meta.requestId;
      })
      .addCase(fetchVendorOrders.fulfilled, (state, action) => {
        if (state.vendorRequestId !== action.meta.requestId) return;
        state.vendorStatus = "succeeded";
        state.vendor = action.payload.orders;
        state.vendorPagination = action.payload.pagination;
      })
      .addCase(fetchVendorOrders.rejected, (state, action) => {
        if (state.vendorRequestId !== action.meta.requestId) return;
        state.vendorStatus = "failed";
        state.vendorError = action.payload;
      })

      // Orders are per-account, so they must not survive a sign-out.
      .addCase(logout.fulfilled, () => initialState);
  },
});

export const { clearOrderFeedback, resetCheckout } = orderSlice.actions;

export default orderSlice.reducer;
