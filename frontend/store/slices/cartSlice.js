import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api, { getErrorMessage } from "@/lib/api";
import { logout } from "./authSlice";
import { placeOrder } from "./orderSlice";

// Every /cart endpoint is buyer-only on the backend, so nothing here fires
// until the session is restored and the user turns out to be a buyer.
export const fetchCart = createAsyncThunk(
  "cart/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/cart");
      return data.cart;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const addToCart = createAsyncThunk(
  "cart/add",
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/cart", { productId, quantity });
      return data.cart;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const updateCartItem = createAsyncThunk(
  "cart/update",
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch("/cart", { productId, quantity });
      return data.cart;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

// The backend reads productId from the request body, and axios only sends a
// body on DELETE when it is passed as `data` — a bare second argument would be
// treated as config and silently dropped.
export const removeCartItem = createAsyncThunk(
  "cart/remove",
  async (productId, { rejectWithValue }) => {
    try {
      const { data } = await api.delete("/cart", { data: { productId } });
      return data.cart;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const clearCart = createAsyncThunk(
  "cart/clear",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.delete("/cart/clear");
      return data.cart;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const initialState = {
  // Each item is { productId: { _id, name, price, stock, images, status },
  // quantity } — the backend populates the product on every response.
  items: [],
  status: "idle", // idle | loading | succeeded | failed
  error: null,

  // Only the row being changed shows a spinner, not the whole cart.
  pendingId: null,
  clearing: false,
  actionError: null,

  // Lets the product page show "Added to bag" without re-reading the cart.
  lastAddedId: null,
};

const applyCart = (state, cart) => {
  state.items = cart?.items ?? [];
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    clearCartFeedback: (state) => {
      state.actionError = null;
      state.lastAddedId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.status = "succeeded";
        applyCart(state, action.payload);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      .addCase(addToCart.pending, (state, action) => {
        state.pendingId = action.meta.arg.productId;
        state.actionError = null;
        state.lastAddedId = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.pendingId = null;
        state.lastAddedId = action.meta.arg.productId;
        applyCart(state, action.payload);
        // A buyer can add from a product page before the cart was ever read.
        state.status = "succeeded";
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.pendingId = null;
        state.actionError = action.payload;
      })

      .addCase(updateCartItem.pending, (state, action) => {
        state.pendingId = action.meta.arg.productId;
        state.actionError = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.pendingId = null;
        applyCart(state, action.payload);
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.pendingId = null;
        state.actionError = action.payload;
      })

      .addCase(removeCartItem.pending, (state, action) => {
        state.pendingId = action.meta.arg;
        state.actionError = null;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        state.pendingId = null;
        applyCart(state, action.payload);
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.pendingId = null;
        state.actionError = action.payload;
      })

      .addCase(clearCart.pending, (state) => {
        state.clearing = true;
        state.actionError = null;
      })
      .addCase(clearCart.fulfilled, (state, action) => {
        state.clearing = false;
        applyCart(state, action.payload);
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.clearing = false;
        state.actionError = action.payload;
      })

      // Checkout consumes the whole cart on the server.
      .addCase(placeOrder.fulfilled, (state) => {
        state.items = [];
      })

      // Without this the next person to sign in on this browser would briefly
      // see the previous buyer's cart.
      .addCase(logout.fulfilled, () => initialState);
  },
});

// A line whose product was hard-deleted comes back as null, so every derived
// value has to tolerate that rather than reading straight through.
export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectCartTotal = (state) =>
  state.cart.items.reduce(
    (sum, item) => sum + (item.productId?.price ?? 0) * item.quantity,
    0
  );

export const { clearCartFeedback } = cartSlice.actions;

export default cartSlice.reducer;
